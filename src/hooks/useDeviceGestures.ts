import { useCallback } from "react";

/**
 * Placeholder for device-detail gestures. Handlers are wired but currently
 * no-ops, keeping the API stable for later parts (swipe back navigation,
 * pull to refresh via discovery, long-press for quick actions).
 */
export interface DeviceGesturesOptions {
  deviceId: string;
  onSwipeBack?: () => void;
  onPullToRefresh?: () => void;
  onLongPress?: () => void;
}

export interface DeviceGestureHandlers {
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export function useDeviceGestures(
  _options: DeviceGesturesOptions,
): DeviceGestureHandlers {
  // TODO(part-8): implement swipe-back, pull-to-refresh, long-press.
  return {
    onTouchStart: useCallback(() => {}, []),
    onTouchEnd: useCallback(() => {}, []),
    onContextMenu: useCallback(() => {}, []),
  };
}
