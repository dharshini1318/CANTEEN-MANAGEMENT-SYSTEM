"use client";
import { useEffect, useRef } from "react";

export function DotOrbBackground({ className }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width, height;
    let particles = [];
    let mouse = { x: 0, y: 0, active: false };
    let animationFrame;
    
    // Detect theme
    const getThemeColor = () => {
      const root = document.documentElement;
      const isDark = root.classList.contains('dark');
      return isDark 
        ? { dot: 'rgba(107, 145, 96, ', glow: 'rgba(107, 145, 96, ', line: 'rgba(178, 175, 159, ' }
        : { dot: 'rgba(40, 60, 35, ', glow: 'rgba(40, 60, 35, ', line: 'rgba(74, 68, 56, ' };
    };

    const numParticles = Math.min(900, Math.floor(window.innerWidth * 0.65));
    const orbRadius = Math.max(window.innerWidth, window.innerHeight) * 0.6;
    
    let autoRotY = 0;
    let tiltX = 0;
    let tiltY = 0;
    let targetTiltX = 0;
    let targetTiltY = 0;
    let mouseTimeout;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    window.addEventListener("resize", resize);
    resize();

    // Fibonacci sphere distribution
    for (let i = 0; i < numParticles; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / numParticles);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
      
      particles.push({
        baseX: orbRadius * Math.cos(theta) * Math.sin(phi),
        baseY: orbRadius * Math.sin(theta) * Math.sin(phi),
        baseZ: orbRadius * Math.cos(phi),
        x: 0, y: 0, z: 0,
      });
    }

    const onMouseMove = (e) => {
      mouse.x = e.clientX - width / 2;
      mouse.y = e.clientY - height / 2;
      mouse.active = true;
      targetTiltX = mouse.y * 0.0015;
      targetTiltY = mouse.x * 0.0015;

      clearTimeout(mouseTimeout);
      mouseTimeout = setTimeout(() => {
        mouse.active = false;
        autoRotY += tiltY;
        tiltY = 0;
        targetTiltY = 0;
        targetTiltX = 0;
      }, 300);
    };

    const onMouseLeave = () => {
      clearTimeout(mouseTimeout);
      mouse.active = false;
      autoRotY += tiltY;
      tiltY = 0;
      targetTiltY = 0;
      targetTiltX = 0;
    };

    const onTouchMove = (e) => {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX - width / 2;
        mouse.y = e.touches[0].clientY - height / 2;
        mouse.active = true;
        targetTiltX = mouse.y * 0.003;
        targetTiltY = mouse.x * 0.003;

        clearTimeout(mouseTimeout);
        mouseTimeout = setTimeout(() => {
          mouse.active = false;
          autoRotY += tiltY;
          tiltY = 0;
          targetTiltY = 0;
          targetTiltX = 0;
        }, 300);
      }
    };

    const onTouchEnd = () => {
      clearTimeout(mouseTimeout);
      mouse.active = false;
      autoRotY += tiltY;
      tiltY = 0;
      targetTiltY = 0;
      targetTiltX = 0;
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const colors = getThemeColor();

      // Smooth rotation easing for tilt
      tiltX += (targetTiltX - tiltX) * 0.04;
      tiltY += (targetTiltY - tiltY) * 0.04;
      
      // Auto-rotate slowly when inactive
      if (!mouse.active) {
        autoRotY += 0.003;
      }
      
      const finalRotX = tiltX;
      const finalRotY = autoRotY + tiltY;

      const cx = width / 2;
      const cy = height / 2;
      const focalLength = 900;

      // Transform all particles
      const projected = [];
      for (const p of particles) {
        // Rotate around X axis
        const y1 = p.baseY * Math.cos(finalRotX) - p.baseZ * Math.sin(finalRotX);
        const z1 = p.baseY * Math.sin(finalRotX) + p.baseZ * Math.cos(finalRotX);
        
        // Rotate around Y axis
        const x2 = p.baseX * Math.cos(finalRotY) + z1 * Math.sin(finalRotY);
        const z2 = -p.baseX * Math.sin(finalRotY) + z1 * Math.cos(finalRotY);
        
        let fx = x2, fy = y1;
        
        // Interactive repulsion
        if (mouse.active) {
          const dx = cx + fx - (mouse.x + cx);
          const dy = cy + fy - (mouse.y + cy);
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160 && z2 > -orbRadius * 0.3) {
            const force = (160 - dist) / 160;
            fx += (dx / dist) * force * 18;
            fy += (dy / dist) * force * 18;
          }
        }

        const scale = focalLength / (focalLength + z2);
        projected.push({
          px: cx + fx * scale,
          py: cy + fy * scale,
          z: z2,
          scale,
          fx, fy
        });
      }

      // Draw dots with glow
      for (const pt of projected) {
        const size = Math.max(1.5, 5.0 * pt.scale);
        const depthFactor = (pt.z + orbRadius) / (orbRadius * 2);
        const opacity = Math.min(1, Math.max(0.15, depthFactor * 1.5));
        
        // Subtle glow for front-facing dots
        if (depthFactor > 0.6) {
          const glowSize = size * 3;
          const gradient = ctx.createRadialGradient(pt.px, pt.py, 0, pt.px, pt.py, glowSize);
          gradient.addColorStop(0, colors.glow + (opacity * 0.15) + ')');
          gradient.addColorStop(1, colors.glow + '0)');
          ctx.beginPath();
          ctx.arc(pt.px, pt.py, glowSize, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(pt.px, pt.py, size, 0, Math.PI * 2);
        ctx.fillStyle = colors.dot + opacity + ')';
        ctx.fill();
      }

      animationFrame = requestAnimationFrame(render);
    };

    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      render();
    } else {
      // Render one static frame
      autoRotation = 0.5;
      const colors = getThemeColor();
      ctx.clearRect(0, 0, width, height);
      // Just draw static dots without animation
      const cx = width / 2;
      const cy = height / 2;
      for (const p of particles) {
        const scale = 900 / (900 + p.baseZ);
        const px = cx + p.baseX * scale;
        const py = cy + p.baseY * scale;
        const opacity = Math.max(0.15, (p.baseZ + orbRadius) / (orbRadius * 2) * 1.5);
        ctx.beginPath();
        ctx.arc(px, py, Math.max(1.5, 4.0 * scale), 0, Math.PI * 2);
        ctx.fillStyle = colors.dot + opacity + ')';
        ctx.fill();
      }
    }

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} style={{ display: "block", width: "100%", height: "100%" }} />;
}
