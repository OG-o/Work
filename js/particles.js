// Visual FX, Starfield & Particle Engine
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.shockwaves = [];
    this.floatingTexts = [];
    this.stars = [];
    this.starCount = 120;
  }

  initStars(width, height) {
    this.stars = [];
    for (let i = 0; i < this.starCount; i++) {
      this.stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() < 0.7 ? 1 : Math.random() < 0.9 ? 1.8 : 2.6,
        speed: 0.5 + Math.random() * 2,
        brightness: 0.3 + Math.random() * 0.7,
        twinkle: Math.random() * Math.PI * 2
      });
    }
  }

  addThruster(x, y, vx, vy, color = '#00f0ff') {
    this.particles.push({
      x: x + (Math.random() - 0.5) * 6,
      y: y,
      vx: (Math.random() - 0.5) * 1 + vx * 0.2,
      vy: Math.random() * 3 + 2,
      size: Math.random() * 3.5 + 2,
      color: color,
      alpha: 0.8,
      decay: 0.04 + Math.random() * 0.03
    });
  }

  addExplosion(x, y, color = '#ff5533', count = 25, power = 4) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.5 + Math.random() * 0.8) * power;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        color: Math.random() < 0.3 ? '#ffffff' : Math.random() < 0.6 ? '#ffaa00' : color,
        alpha: 1,
        decay: 0.02 + Math.random() * 0.02
      });
    }

    this.shockwaves.push({
      x: x,
      y: y,
      radius: 5,
      maxRadius: 35 + power * 8,
      color: color,
      alpha: 0.8,
      speed: 3 + power * 0.8
    });
  }

  addHitSparks(x, y, color = '#ffea00', count = 6) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 2 + 1,
        color: color,
        alpha: 1,
        decay: 0.05 + Math.random() * 0.05
      });
    }
  }

  addText(text, x, y, color = '#00f0ff', size = 14) {
    this.floatingTexts.push({
      text: text,
      x: x,
      y: y,
      vy: -1.2,
      alpha: 1,
      decay: 0.02,
      color: color,
      size: size
    });
  }

  update(width, height, warpSpeed = 1) {
    // Update Stars
    for (let star of this.stars) {
      star.y += star.speed * warpSpeed;
      star.twinkle += 0.03;
      if (star.y > height) {
        star.y = 0;
        star.x = Math.random() * width;
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      p.size *= 0.98;
      if (p.alpha <= 0 || p.size <= 0.5) {
        this.particles.splice(i, 1);
      }
    }

    // Update Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.speed;
      sw.alpha = 1 - (sw.radius / sw.maxRadius);
      if (sw.radius >= sw.maxRadius || sw.alpha <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= ft.decay;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  draw(ctx, width, height) {
    // Draw Starfield
    for (let star of this.stars) {
      const flicker = star.brightness + Math.sin(star.twinkle) * 0.2;
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, Math.min(1, flicker))})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Shockwaves
    ctx.save();
    for (let sw of this.shockwaves) {
      ctx.strokeStyle = sw.color;
      ctx.globalAlpha = Math.max(0, sw.alpha);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // Draw Particles
    ctx.save();
    for (let p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Draw Floating Texts
    ctx.save();
    ctx.textAlign = 'center';
    for (let ft of this.floatingTexts) {
      ctx.font = `bold ${ft.size}px 'Plus Jakarta Sans', sans-serif`;
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 8;
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.restore();
  }

  clear() {
    this.particles = [];
    this.shockwaves = [];
    this.floatingTexts = [];
  }
}

window.particleSystem = new ParticleSystem();
