type SplineApplication = {
  _renderer?: {
    pipeline?: {
      setWatermark: (texture: null) => void;
    };
  };
};

export function hideSplineWatermark(application: unknown) {
  const spline = application as SplineApplication;
  spline._renderer?.pipeline?.setWatermark(null);
}
