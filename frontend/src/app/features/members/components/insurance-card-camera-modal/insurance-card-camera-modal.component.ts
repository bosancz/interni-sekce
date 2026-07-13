import { AfterViewInit, Component, ElementRef, OnDestroy, signal, viewChild } from "@angular/core";
import { IonButton, IonButtons, IonIcon, IonSpinner, ModalController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { cameraOutline, checkmarkOutline, flashOffOutline, flashOutline, refreshOutline } from "ionicons/icons";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";

/**
 * Aspect ratio of an ID-1 card (bank / insurance card): 85.6mm × 53.98mm ≈ 1.586.
 * The on-screen guide frame and the captured crop both use this ratio so that the
 * photo matches exactly what the user framed.
 */
const CARD_ASPECT_RATIO = 85.6 / 53.98;

/** Longest edge of the produced image, keeps the upload small while staying sharp. */
const OUTPUT_MAX_WIDTH = 1600;

type CaptureState = "initializing" | "live" | "preview" | "error";

@Component({
	selector: "bo-insurance-card-camera-modal",
	templateUrl: "./insurance-card-camera-modal.component.html",
	styleUrls: ["./insurance-card-camera-modal.component.scss"],

	imports: [ModalLayoutComponent, IonButton, IonButtons, IonIcon, IonSpinner],
})
export class InsuranceCardCameraModalComponent extends InputModalComponent<File> implements AfterViewInit, OnDestroy {
	private video = viewChild<ElementRef<HTMLVideoElement>>("video");
	private frame = viewChild<ElementRef<HTMLDivElement>>("frame");

	readonly cardAspectRatio = CARD_ASPECT_RATIO;

	state = signal<CaptureState>("initializing");
	errorMessage = signal<string>("");

	torchAvailable = signal(false);
	torchOn = signal(false);

	/** Data URL of the freshly cropped photo, shown in the preview step. */
	previewUrl = signal<string | null>(null);

	private stream: MediaStream | null = null;
	/** The cropped photo, produced on capture and uploaded when confirmed. */
	private capturedFile: File | null = null;

	constructor(modalController: ModalController) {
		super(modalController);
		addIcons({ cameraOutline, checkmarkOutline, refreshOutline, flashOutline, flashOffOutline });
	}

	async ngAfterViewInit() {
		await this.startCamera();
	}

	ngOnDestroy() {
		this.stopCamera();
	}

	private async startCamera() {
		this.state.set("initializing");

		if (!navigator.mediaDevices?.getUserMedia) {
			this.fail("Tento prohlížeč nepodporuje přístup ke kameře.");
			return;
		}

		try {
			// Prefer the rear camera at a high resolution – best for reading small print off a card.
			this.stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: { ideal: "environment" },
					width: { ideal: 1920 },
					height: { ideal: 1080 },
				},
				audio: false,
			});

			const videoEl = this.video()?.nativeElement;
			if (!videoEl) {
				this.fail("Nepodařilo se zobrazit náhled kamery.");
				return;
			}

			videoEl.srcObject = this.stream;
			await videoEl.play();

			this.detectTorch();
			this.state.set("live");
		} catch (e) {
			this.fail("Nepodařilo se získat přístup ke kameře. Zkontrolujte oprávnění a zkuste to znovu.");
		}
	}

	private detectTorch() {
		const track = this.stream?.getVideoTracks()[0];
		const capabilities = track?.getCapabilities?.() as (MediaTrackCapabilities & { torch?: boolean }) | undefined;
		this.torchAvailable.set(!!capabilities?.torch);
	}

	async toggleTorch() {
		const track = this.stream?.getVideoTracks()[0];
		if (!track) return;

		const next = !this.torchOn();
		try {
			await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] });
			this.torchOn.set(next);
		} catch {
			// Some devices report torch support but reject the constraint – just hide the option.
			this.torchAvailable.set(false);
		}
	}

	private stopCamera() {
		this.stream?.getTracks().forEach((track) => track.stop());
		this.stream = null;
		this.torchOn.set(false);
	}

	private fail(message: string) {
		this.errorMessage.set(message);
		this.state.set("error");
	}

	/**
	 * Grabs the current video frame and crops it to the region covered by the guide
	 * frame. The video is rendered with `object-fit: cover`, so the mapping between
	 * the displayed frame and the intrinsic camera pixels has to account for the
	 * scaling and centering the browser applies.
	 */
	capture() {
		const videoEl = this.video()?.nativeElement;
		const frameEl = this.frame()?.nativeElement;
		if (!videoEl || !frameEl) return;

		const intrinsicW = videoEl.videoWidth;
		const intrinsicH = videoEl.videoHeight;
		if (!intrinsicW || !intrinsicH) return;

		const videoRect = videoEl.getBoundingClientRect();
		const frameRect = frameEl.getBoundingClientRect();

		// object-fit: cover scales the video up until it fills the box, cropping the overflow.
		const scale = Math.max(videoRect.width / intrinsicW, videoRect.height / intrinsicH);
		const visibleW = videoRect.width / scale;
		const visibleH = videoRect.height / scale;
		const offsetX = (intrinsicW - visibleW) / 2;
		const offsetY = (intrinsicH - visibleH) / 2;

		// Guide frame position relative to the video element, mapped into intrinsic pixels.
		const cropX = offsetX + (frameRect.left - videoRect.left) / scale;
		const cropY = offsetY + (frameRect.top - videoRect.top) / scale;
		const cropW = frameRect.width / scale;
		const cropH = frameRect.height / scale;

		const outputW = Math.min(OUTPUT_MAX_WIDTH, Math.round(cropW));
		const outputH = Math.round(outputW / (cropW / cropH));

		const canvas = document.createElement("canvas");
		canvas.width = outputW;
		canvas.height = outputH;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		ctx.drawImage(videoEl, cropX, cropY, cropW, cropH, 0, 0, outputW, outputH);

		canvas.toBlob(
			(blob) => {
				if (!blob) return;
				this.capturedFile = new File([blob], "insurance-card.jpg", { type: "image/jpeg" });
				this.previewUrl.set(canvas.toDataURL("image/jpeg"));
				this.state.set("preview");
				this.stopCamera();
			},
			"image/jpeg",
			0.92,
		);
	}

	/** Discard the captured photo and go back to the live camera. */
	async retake() {
		this.capturedFile = null;
		this.previewUrl.set(null);
		await this.startCamera();
	}

	/** Confirm the captured photo – hands the file back to the caller for upload. */
	confirm() {
		if (this.capturedFile) this.submit.emit(this.capturedFile);
	}
}
