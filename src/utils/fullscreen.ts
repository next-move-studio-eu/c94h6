type FullscreenDocument = Document & {
  webkitExitFullscreen?: () => void;
  mozCancelFullScreen?: () => void;
  msExitFullscreen?: () => void;
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => void;
  mozRequestFullScreen?: () => void;
  msRequestFullscreen?: () => void;
};

const FULLSCREEN_CHANGE_EVENTS = [
  'fullscreenchange',
  'webkitfullscreenchange',
  'mozfullscreenchange',
  'MSFullscreenChange',
] as const;

export function requestElementFullscreen(element: HTMLElement) {
  const fullscreenElement = element as FullscreenElement;

  if (fullscreenElement.requestFullscreen) {
    fullscreenElement.requestFullscreen();
  } else if (fullscreenElement.webkitRequestFullscreen) {
    fullscreenElement.webkitRequestFullscreen();
  } else if (fullscreenElement.mozRequestFullScreen) {
    fullscreenElement.mozRequestFullScreen();
  } else if (fullscreenElement.msRequestFullscreen) {
    fullscreenElement.msRequestFullscreen();
  }
}

export function exitDocumentFullscreen() {
  const fullscreenDocument = document as FullscreenDocument;

  if (fullscreenDocument.exitFullscreen) {
    fullscreenDocument.exitFullscreen();
  } else if (fullscreenDocument.webkitExitFullscreen) {
    fullscreenDocument.webkitExitFullscreen();
  } else if (fullscreenDocument.mozCancelFullScreen) {
    fullscreenDocument.mozCancelFullScreen();
  } else if (fullscreenDocument.msExitFullscreen) {
    fullscreenDocument.msExitFullscreen();
  }
}

export function getFullscreenElement(): Element | null {
  const fullscreenDocument = document as FullscreenDocument;

  return (
    document.fullscreenElement ??
    fullscreenDocument.webkitFullscreenElement ??
    fullscreenDocument.mozFullScreenElement ??
    fullscreenDocument.msFullscreenElement ??
    null
  );
}

export function isElementInFullscreen(element: HTMLElement | null): boolean {
  return getFullscreenElement() === element;
}

export function subscribeToFullscreenChanges(listener: () => void) {
  FULLSCREEN_CHANGE_EVENTS.forEach((eventName) => {
    document.addEventListener(eventName, listener);
  });

  return () => {
    FULLSCREEN_CHANGE_EVENTS.forEach((eventName) => {
      document.removeEventListener(eventName, listener);
    });
  };
}
