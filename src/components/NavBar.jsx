"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

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

export default function NavBar({ brand = "BeginnerLMS", navLinks = [], rightContent = null }) {
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const defaultLinks = [
    { label: "Courses", hasDropdown: true },
    { label: "Dashboard", path: "/home" },
    { label: "Pricing", path: "#" },
  ];

  const links = navLinks.length ? navLinks : defaultLinks;

  return (
    <motion.header
        initial={{ backgroundColor: "rgba(17, 17, 17, 0.8)" }}
        animate={{ backgroundColor: isScrolled ? "rgba(17, 17, 17, 0.95)" : "rgba(17, 17, 17, 0.8)" }}
        className="px-6 w-full md:px-10 lg:px-16 fixed top-0 z-30 backdrop-blur-md border-b border-gray-800/50"
    >
        <nav className="flex justify-between items-center max-w-screen-xl mx-auto h-[70px]">
            <div className="flex items-center flex-shrink-0 cursor-pointer" onClick={() => navigate("/")}>
                <ShieldCheck className="w-8 h-8 text-[#60A5FA]" />
                <span className="text-xl font-bold text-white ml-2">{brand}</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              {links.map((link) => {
                if (link.hasDropdown) {
                  return (
                    <div key={link.label} className="relative" onMouseEnter={() => setOpenDropdown('courses')} onMouseLeave={() => setOpenDropdown(null)}>
                      <NavLink hasDropdown>{link.label}</NavLink>
                      <DropdownMenu isOpen={openDropdown === 'courses'}>
                          <DropdownItem icon={<ArrowRight className="w-4 h-4" />}>Web Development</DropdownItem>
                          <DropdownItem icon={<ArrowRight className="w-4 h-4" />}>Data Science</DropdownItem>
                          <DropdownItem icon={<ArrowRight className="w-4 h-4" />}>UI/UX Design</DropdownItem>
                      </DropdownMenu>
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={link.label}
                    onClick={() => link.path ? navigate(link.path) : undefined}
                  >
                    {link.label}
                  </NavLink>
                );
              })}
            </div>

            <div className="flex items-center space-x-4">
                {rightContent || (
                  <>
                    <NavLink onClick={() => navigate("/login")} className="hidden md:inline-block">Sign in</NavLink>
                    <Button
                        onClick={() => navigate("/signup")}
                        className="bg-[#60A5FA] text-[#111111] hover:bg-[#60A5FA]/90 font-semibold rounded-md px-6"
                    >
                      Get Started
                    </Button>
                  </>
                )}
            </div>
        </nav>
    </motion.header>
  );
}
