"use client";

import React, {
    useEffect,
    useRef,
    useState,
    useCallback,
    forwardRef,
    useImperativeHandle,
    useMemo,
} from 'react';
import { useNavigate } from "react-router-dom";
import {
    motion,
    AnimatePresence,
    useScroll,
    useMotionValueEvent,
} from 'framer-motion';
import { 
  ShieldCheck, 
  ArrowRight, 
  ChevronDown, 
  ExternalLink, 
  Menu, 
  X,
  Mail,
  Lock,
  Chrome,
  Github
} from "lucide-react";
import { Button } from "@/components/ui/button";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const RotatingText = forwardRef(function RotatingText(
  {
    texts,
    transition = { type: "spring", damping: 25, stiffness: 300 },
    initial = { y: "100%", opacity: 0 },
    animate = { y: 0, opacity: 1 },
    exit = { y: "-120%", opacity: 0 },
    animatePresenceMode = "wait",
    animatePresenceInitial = false,
    rotationInterval = 2200,
    staggerDuration = 0.01,
    staggerFrom = "last",
    loop = true,
    auto = true,
    splitBy = "characters",
    onNext,
    mainClassName,
    splitLevelClassName,
    elementLevelClassName,
  },
  ref
) {
    const [currentTextIndex, setCurrentTextIndex] = useState(0);

    const splitIntoCharacters = (text) => {
      if (typeof Intl !== "undefined" && Intl.Segmenter) {
        try {
           const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
           return Array.from(segmenter.segment(text), (segment) => segment.segment);
        } catch (e) {
           return text.split('');
        }
      }
      return text.split('');
    };

    const elements = useMemo(() => {
        const currentText = texts[currentTextIndex] ?? '';
        if (splitBy === "characters") {
            const words = currentText.split(/(\s+)/);
            let charCount = 0;
            return words.filter(part => part.length > 0).map((part) => {
                const isSpace = /^\s+$/.test(part);
                const chars = isSpace ? [part] : splitIntoCharacters(part);
                const startIndex = charCount;
                charCount += chars.length;
                return { characters: chars, isSpace: isSpace, startIndex: startIndex };
            });
        }
        return currentText.split(splitBy).map((part, i) => ({
            characters: [part], isSpace: false, startIndex: i
        }));
    }, [texts, currentTextIndex, splitBy]);

    const totalElements = useMemo(() => elements.reduce((sum, el) => sum + el.characters.length, 0), [elements]);

    const getStaggerDelay = useCallback(
      (index, total) => {
        if (total <= 1 || !staggerDuration) return 0;
        const stagger = staggerDuration;
        switch (staggerFrom) {
          case "first": return index * stagger;
          case "last": return (total - 1 - index) * stagger;
          case "center":
            const center = (total - 1) / 2;
            return Math.abs(center - index) * stagger;
          default: return index * stagger;
        }
      },
      [staggerFrom, staggerDuration]
    );

    const handleIndexChange = useCallback(
      (newIndex) => {
        setCurrentTextIndex(newIndex);
        if (onNext) onNext(newIndex);
      },
      [onNext]
    );

    const next = useCallback(() => {
      const nextIndex = currentTextIndex === texts.length - 1 ? (loop ? 0 : currentTextIndex) : currentTextIndex + 1;
      if (nextIndex !== currentTextIndex) handleIndexChange(nextIndex);
    }, [currentTextIndex, texts.length, loop, handleIndexChange]);

    const previous = useCallback(() => {
      const prevIndex = currentTextIndex === 0 ? (loop ? texts.length - 1 : currentTextIndex) : currentTextIndex - 1;
      if (prevIndex !== currentTextIndex) handleIndexChange(prevIndex);
    }, [currentTextIndex, texts.length, loop, handleIndexChange]);

    useImperativeHandle(ref, () => ({ next, previous, jumpTo: (idx) => handleIndexChange(idx), reset: () => handleIndexChange(0) }));

    useEffect(() => {
      if (!auto || texts.length <= 1) return;
      const intervalId = setInterval(next, rotationInterval);
      return () => clearInterval(intervalId);
    }, [next, rotationInterval, auto, texts.length]);

    return (
      <span className={cn("inline-flex flex-wrap whitespace-pre-wrap relative align-bottom pb-[10px]", mainClassName)}>
        <span className="sr-only">{texts[currentTextIndex]}</span>
        <AnimatePresence mode={animatePresenceMode} initial={animatePresenceInitial}>
          <motion.div
            key={currentTextIndex}
            className={cn("inline-flex flex-wrap relative flex-row items-baseline")}
            layout
            aria-hidden="true"
            initial="initial"
            animate="animate"
            exit="exit"
          >
             {elements.map((elementObj, elementIndex) => (
                <span
                    key={elementIndex}
                    className={cn("inline-flex", splitLevelClassName)}
                    style={{ whiteSpace: 'pre' }}
                >
                    {elementObj.characters.map((char, charIndex) => {
                        const globalIndex = elementObj.startIndex + charIndex;
                        return (
                            <motion.span
                                key={`${char}-${charIndex}`}
                                initial={initial}
                                animate={animate}
                                exit={exit}
                                transition={{
                                    ...transition,
                                    delay: getStaggerDelay(globalIndex, totalElements),
                                }}
                                className={cn("inline-block leading-none tracking-tight", elementLevelClassName)}
                            >
                                {char === ' ' ? '\u00A0' : char}
                            </motion.span>
                        );
                     })}
                </span>
             ))}
          </motion.div>
        </AnimatePresence>
      </span>
    );
  }
);

const ShinyText = ({ text, className = "" }) => (
    <span className={cn("relative overflow-hidden inline-block", className)}>
        {text}
        <span style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
            animation: 'shine 2s infinite linear',
            opacity: 0.5,
            pointerEvents: 'none'
        }}></span>
        <style>{`
            @keyframes shine {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
        `}</style>
    </span>
);

const NavLink = ({ href = "#", children, hasDropdown = false, className = "", onClick }) => (
   <motion.a
     href={href}
     onClick={onClick}
     className={cn("relative group text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200 flex items-center py-1 cursor-pointer", className)}
     whileHover="hover"
   >
     {children}
     {hasDropdown && <ChevronDown className="w-3 h-3 ml-1 transition-transform duration-200 group-hover:rotate-180" />}
     {!hasDropdown && (
         <motion.div
            className="absolute bottom-[-2px] left-0 right-0 h-[1px] bg-[#60A5FA]"
           variants={{ initial: { scaleX: 0, originX: 0.5 }, hover: { scaleX: 1, originX: 0.5 } }}
           initial="initial"
           transition={{ duration: 0.3, ease: "easeOut" }}
         />
     )}
   </motion.a>
 );

const DropdownMenu = ({ children, isOpen }) => (
   <AnimatePresence>
     {isOpen && (
       <motion.div
         initial={{ opacity: 0, y: 10, scale: 0.95 }}
         animate={{ opacity: 1, y: 0, scale: 1 }}
         exit={{ opacity: 0, y: 10, scale: 0.95, transition: { duration: 0.15 } }}
         transition={{ duration: 0.2, ease: "easeOut" }}
         className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-56 origin-top z-40"
       >
           <div className="bg-[#111111] border border-gray-700/50 rounded-md shadow-xl p-2">
               {children}
           </div>
       </motion.div>
     )}
   </AnimatePresence>
);

const DropdownItem = ({ href = "#", children, icon }) => (
 <a
   href={href}
   className="group flex items-center justify-between w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/30 hover:text-white rounded-md transition-colors duration-150"
 >
   <span>{children}</span>
   {icon}
 </a>
);

const InteractiveHero = () => {
   const navigate = useNavigate();
   const canvasRef = useRef(null);
   const animationFrameId = useRef(null);
   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
   const [openDropdown, setOpenDropdown] = useState(null);
   const [isScrolled, setIsScrolled] = useState(false);

   const { scrollY } = useScroll();
   useMotionValueEvent(scrollY, "change", (latest) => {
       setIsScrolled(latest > 10);
   });

   const dotsRef = useRef([]);
   const canvasSizeRef = useRef({ width: 0, height: 0 });
   const mousePositionRef = useRef({ x: null, y: null });
   const BASE_OPACITY_MIN = 0.05;
   const DOT_SPACING = 50;
   
   const BASE_OPACITY_MAX = 0.50;
   const BASE_RADIUS = 1;
   const INTERACTION_RADIUS = 150;
   const INTERACTION_RADIUS_SQ = INTERACTION_RADIUS * INTERACTION_RADIUS;
   const OPACITY_BOOST = 0.6;
   const RADIUS_BOOST = 2.5;

   const handleMouseMove = useCallback((event) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        mousePositionRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
   }, []);

   const createDots = useCallback(() => {
       const { width, height } = canvasSizeRef.current;
       if (width === 0 || height === 0) return;

       const newDots = [];
       const cols = Math.ceil(width / DOT_SPACING);
       const rows = Math.ceil(height / DOT_SPACING);

       for (let i = 0; i < cols; i++) {
           for (let j = 0; j < rows; j++) {
               const x = i * DOT_SPACING + DOT_SPACING / 2;
               const y = j * DOT_SPACING + DOT_SPACING / 2;
               const baseOpacity = Math.random() * (BASE_OPACITY_MAX - BASE_OPACITY_MIN) + BASE_OPACITY_MIN;
               newDots.push({
                   x, y,
                   targetOpacity: baseOpacity,
                   currentOpacity: baseOpacity,
                   opacitySpeed: (Math.random() * 0.005) + 0.002,
                   baseRadius: BASE_RADIUS,
               });
           }
       }
       dotsRef.current = newDots;
   }, []);

   const handleResize = useCallback(() => {
       const canvas = canvasRef.current;
       if (!canvas) return;
       const width = canvas.parentElement.clientWidth;
       const height = canvas.parentElement.clientHeight;
       canvas.width = width;
       canvas.height = height;
       canvasSizeRef.current = { width, height };
       createDots();
   }, [createDots]);

   const animateDots = useCallback(() => {
       const canvas = canvasRef.current;
       const ctx = canvas?.getContext('2d');
       const { width, height } = canvasSizeRef.current;
       const { x: mouseX, y: mouseY } = mousePositionRef.current;

       if (!ctx || width === 0) {
           animationFrameId.current = requestAnimationFrame(animateDots);
           return;
       }

       ctx.clearRect(0, 0, width, height);
       dotsRef.current.forEach((dot) => {
           dot.currentOpacity += dot.opacitySpeed;
           if (dot.currentOpacity >= dot.targetOpacity || dot.currentOpacity <= BASE_OPACITY_MIN) {
               dot.opacitySpeed = -dot.opacitySpeed;
           }

           let interactionFactor = 0;
           if (mouseX !== null && mouseY !== null) {
               const dx = dot.x - mouseX;
               const dy = dot.y - mouseY;
               const distSq = dx * dx + dy * dy;
               if (distSq < INTERACTION_RADIUS_SQ) {
                   interactionFactor = Math.pow(Math.max(0, 1 - Math.sqrt(distSq) / INTERACTION_RADIUS), 2);
               }
           }

           const finalOpacity = Math.min(1, dot.currentOpacity + interactionFactor * OPACITY_BOOST);
           ctx.beginPath();
            ctx.fillStyle = `rgba(96, 165, 250, ${finalOpacity})`;
           ctx.arc(dot.x, dot.y, BASE_RADIUS + interactionFactor * RADIUS_BOOST, 0, Math.PI * 2);
           ctx.fill();
       });
       animationFrameId.current = requestAnimationFrame(animateDots);
   }, []);

   useEffect(() => {
       handleResize();
       window.addEventListener('mousemove', handleMouseMove, { passive: true });
       window.addEventListener('resize', handleResize);
       animationFrameId.current = requestAnimationFrame(animateDots);
       return () => {
           window.removeEventListener('resize', handleResize);
           window.removeEventListener('mousemove', handleMouseMove);
           cancelAnimationFrame(animationFrameId.current);
       };
   }, [handleResize, handleMouseMove, animateDots]);

  return (
    <div className="pt-[100px] relative bg-[#111111] text-gray-300 min-h-screen flex flex-col overflow-x-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-80" />
        <div className="absolute inset-0 z-1 pointer-events-none" style={{
            background: 'linear-gradient(to bottom, transparent 0%, #111111 90%), radial-gradient(ellipse at center, transparent 40%, #111111 95%)'
        }}></div>

        <motion.header
            initial={{ backgroundColor: "rgba(17, 17, 17, 0.8)" }}
            animate={{ backgroundColor: isScrolled ? "rgba(17, 17, 17, 0.95)" : "rgba(17, 17, 17, 0.8)" }}
            className="px-6 w-full md:px-10 lg:px-16 fixed top-0 z-30 backdrop-blur-md border-b border-gray-800/50"
        >
            <nav className="flex justify-between items-center max-w-screen-xl mx-auto h-[70px]">
                <div className="flex items-center flex-shrink-0 cursor-pointer" onClick={() => navigate("/")}>
                    <ShieldCheck className="w-8 h-8 text-[#60A5FA]" />
                    <span className="text-xl font-bold text-white ml-2">BeginnerLMS</span>
                </div>

                <div className="hidden md:flex items-center space-x-8">
                    <div className="relative" onMouseEnter={() => setOpenDropdown('courses')} onMouseLeave={() => setOpenDropdown(null)}>
                        <NavLink hasDropdown>Courses</NavLink>
                        <DropdownMenu isOpen={openDropdown === 'courses'}>
                            <DropdownItem icon={<ArrowRight className="w-4 h-4" />}>Web Development</DropdownItem>
                            <DropdownItem icon={<ArrowRight className="w-4 h-4" />}>Data Science</DropdownItem>
                            <DropdownItem icon={<ArrowRight className="w-4 h-4" />}>UI/UX Design</DropdownItem>
                        </DropdownMenu>
                    </div>
                    <NavLink onClick={() => navigate("/home")}>Dashboard</NavLink>
                    <NavLink>Pricing</NavLink>
                </div>

                <div className="flex items-center space-x-4">
                    <NavLink onClick={() => navigate("/login")} className="hidden md:inline-block">Sign in</NavLink>
                    <Button
                        onClick={() => navigate("/signup")}
                        className="bg-[#60A5FA] text-[#111111] hover:bg-[#60A5FA]/90 font-semibold rounded-md px-6"
                    >
                        Get Started
                    </Button>
                </div>
            </nav>
        </motion.header>

        <main className="flex-grow flex flex-col items-center justify-center text-center px-4 pt-8 pb-16 relative z-10">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <ShinyText text="AI-Powered Learning Experiences" className="bg-[#1a1a1a] border border-gray-700 text-[#60A5FA] px-4 py-1 rounded-full text-sm font-medium" />
            </motion.div>

            <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-5xl md:text-7xl font-semibold text-white leading-tight max-w-4xl mb-4">
                Deliver collaborative<br />{' '}
                <span className="inline-block h-[1.2em] overflow-hidden align-bottom">
                    <RotatingText
                        texts={['Support', 'Courses', 'Quizzes', 'Badges', 'Certificates']}
                         mainClassName="text-[#60A5FA] mx-1"
                    />
                </span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-8">
                Master new skills with our interactive platform. Join thousands of students learning from industry experts.
            </motion.p>

            <div className="flex flex-col sm:flex-row gap-4 mb-16">
                 <Button size="lg" className="bg-[#60A5FA] text-[#111111] hover:bg-[#60A5FA]/90 gap-2 rounded-md px-8" onClick={() => navigate("/signup")}>
                    See LMS in action <ArrowRight className="w-4 h-4" />
                </Button>
                <div className="text-xs text-gray-500 mt-2 sm:mt-4 sm:ml-2">Free 14 day trial</div>
            </div>

            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-4xl mx-auto px-4">
                <img
                    src="https://help.apple.com/assets/679AD2D1E874AD22770DE1E0/679AD2D56EA7B10C9E01288F/en_US/3d2b57c8027ae355aa44421899389008.png"
                    alt="LMS Dashboard Preview"
                    className="w-full h-auto rounded-lg shadow-2xl border border-gray-700/50"
                />
            </motion.div>
        </main>
    </div>
  );
};

export default InteractiveHero;