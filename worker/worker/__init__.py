import os

from .resources import available_cpus

for _variable in ("OPENBLAS_NUM_THREADS", "OMP_NUM_THREADS"):
    os.environ.setdefault(_variable, str(available_cpus()))
