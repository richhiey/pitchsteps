import { useEffect, useRef } from "react";
import { ExternalLink, Mail, X } from "lucide-react";

interface AboutModalProps {
  onClose: () => void;
}

export function AboutModal({ onClose }: AboutModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div className="about-modal" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="about-modal__panel" role="dialog" aria-modal="true" aria-labelledby="about-title">
        <div className="about-modal__header">
          <div>
            <p className="eyebrow">About the project</p>
            <h2 id="about-title">pitchsteps</h2>
          </div>
          <button ref={closeButtonRef} className="about-modal__close" type="button" onClick={onClose} aria-label="Close about pitchsteps">
            <X aria-hidden="true" />
          </button>
        </div>

        <p className="about-modal__lead">
          A private, browser-based pitch coach for building a steadier, more confident start to your voice. Your audio is analyzed locally on this device.
        </p>

        <div className="about-modal__content">
          <div>
            <h3>How to get the most out of it</h3>
            <ol>
              <li>Allow microphone access and choose the input that gives you the cleanest signal.</li>
              <li>Pick a warm-up, set a comfortable starting note, and use “Hear note” to orient yourself.</li>
              <li>Start gently. Follow the highlighted target and aim for a relaxed, even tone rather than volume.</li>
              <li>Review your pitch trail and note-by-note feedback, then repeat or adjust the tempo and guide volume.</li>
            </ol>
          </div>
          <div>
            <h3>Good to know</h3>
            <p>Headphones can make the guide tones easier to hear. A quiet room and a little distance from your speakers will also help the pitch detector stay focused on your voice.</p>
          </div>
        </div>

        <div className="about-modal__footer">
          <a className="about-modal__link" href="https://github.com/richhiey/pitchsteps" target="_blank" rel="noreferrer">
            View the GitHub repository <ExternalLink aria-hidden="true" />
          </a>
          <a className="about-modal__contact" href="mailto:richhiey1996@gmail.com">
            <Mail aria-hidden="true" />
            <span><strong>Questions or ideas?</strong><br />Contact richhiey1996@gmail.com for issues or collaboration.</span>
          </a>
        </div>
      </section>
    </div>
  );
}
