importScripts("./ngsw-worker.js");

self.addEventListener("push", (event) => {
	let unreadCount;
	try {
		unreadCount = event.data?.json()?.notification?.data?.unreadCount;
	} catch {
		return;
	}
	if (typeof unreadCount !== "number" || !("setAppBadge" in self.navigator)) return;

	event.waitUntil(
		(unreadCount > 0 ? self.navigator.setAppBadge(unreadCount) : self.navigator.clearAppBadge()).catch(() => {}),
	);
});
