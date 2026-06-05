import { useEffect, useRef, useState } from "react";

export function Marquee({
  children,
  className = "",
  pauseOnHover = false,
  direction = "left",
}) {
  const marqueeRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const marquee = marqueeRef.current;
    if (!marquee) return;

    let animationId;
    let position = 0;

    const animate = () => {
      if (!isHovered || !pauseOnHover) {
        position = direction === "left" ? position - 1 : position + 1;

        marquee.style.transform = `translateX(${position}px)`;

        // Reset position for infinite loop
        if (direction === "left" && position < -marquee.scrollWidth / 2) {
          position = 0;
        } else if (direction === "right" && position > marquee.scrollWidth / 2) {
          position = 0;
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, [isHovered, pauseOnHover, direction]);

  return (
    <div
      className={`overflow-hidden w-full ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={marqueeRef}
        className="flex whitespace-nowrap"
        style={{ willChange: "transform" }}
      >
        {children}
        {children}
      </div>
    </div>
  );
}
