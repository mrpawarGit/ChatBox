import React from "react";
import { motion } from "framer-motion";
import { FaSpinner } from "react-icons/fa";

export default function Spinner({ size = "medium", color = "light" }) {
  const sizeMap = {
    small: 16,
    medium: 24,
    large: 32,
  };

  const colorClasses = {
    light: "text-white",
    dark: "text-gray-800",
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
      >
        <FaSpinner size={sizeMap[size]} className={colorClasses[color]} />
      </motion.div>
      <span className={`${colorClasses[color]} text-base font-medium`}>
        Loading...
      </span>
    </div>
  );
}
