// Game Entities: Player, Projectiles, Enemies, Boss, Asteroids, PowerUps, Scrap
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 18;
    this.speed = 6.5;
    this.vx = 0;
    this.vy = 0;
    
    // Stats & Upgrades
    this.maxHealth = 100;
    this.health = 100;
    this.maxShield = 50;
    this.shield = 50;
    this.shieldRegenDelay = 180;
    this.shieldTimer = 0;
    
    this.weaponLevel = 1; // 1: single, 2: double, 3: triple, 4: quad, 5: plasma spread
    this.fireCooldown = 0;
    this.fireRate = 12; // Frames between shots (lower is faster)
    this.damageMultiplier = 1;
    this.bulletSpeed = 14;

    this.bombs = 1;
    this.maxBombs = 3;
    this.drones = 0; // Number of escort support drones

    this.invulnerableTimer = 0;
    this.tilt = 0;
    this.magnetRadius = 130;
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.health = this.maxHealth;
    this.shield = this.maxShield;
    this.invulnerableTimer = 120;
    this.weaponLevel = 1;
    this.bombs = 1;
    this.drones = 0;
    this.damageMultiplier = 1;
    this.fireRate = 12;
  }

  update(keys, mousePos, touchActive, canvasWidth, canvasHeight) {
    let targetVx = 0;
    let targetVy = 0;

    if (touchActive && mousePos.x !== null) {
      // Smooth follow for touch/mouse
      const dx = mousePos.x - this.x;
      const dy = mousePos.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 5) {
        targetVx = (dx / dist) * Math.min(this.speed * 1.4, dist * 0.2);
        targetVy = (dy / dist) * Math.min(this.speed * 1.4, dist * 0.2);
      }
    } else {
      // Keyboard input
      if (keys['ArrowLeft'] || keys['KeyA']) targetVx -= this.speed;
      if (keys['ArrowRight'] || keys['KeyD']) targetVx += this.speed;
      if (keys['ArrowUp'] || keys['KeyW']) targetVy -= this.speed;
      if (keys['ArrowDown'] || keys['KeyS']) targetVy += this.speed;
    }

    // Smooth inertia
    this.vx += (targetVx - this.vx) * 0.25;
    this.vy += (targetVy - this.vy) * 0.25;

    this.x += this.vx;
    this.y += this.vy;

    // Boundaries
    const margin = this.radius + 6;
    if (this.x < margin) this.x = margin;
    if (this.x > canvasWidth - margin) this.x = canvasWidth - margin;
    if (this.y < margin) this.y = margin;
    if (this.y > canvasHeight - margin) this.y = canvasHeight - margin;

    // Bank tilt animation
    this.tilt = this.vx * 0.05;

    // Timers
    if (this.fireCooldown > 0) this.fireCooldown--;
    if (this.invulnerableTimer > 0) this.invulnerableTimer--;

    // Shield Regen
    this.shieldTimer++;
    if (this.shieldTimer >= this.shieldRegenDelay && this.shield < this.maxShield) {
      this.shield = Math.min(this.maxShield, this.shield + 0.15);
    }

    // Engine thruster particles
    if (Math.random() < 0.8) {
      window.particleSystem.addThruster(this.x, this.y + this.radius, this.vx, this.vy, '#00f0ff');
      if (this.weaponLevel >= 3) {
        window.particleSystem.addThruster(this.x - 12, this.y + this.radius - 4, this.vx, this.vy, '#00f0ff');
        window.particleSystem.addThruster(this.x + 12, this.y + this.radius - 4, this.vx, this.vy, '#00f0ff');
      }
    }
  }

  takeDamage(amount) {
    if (this.invulnerableTimer > 0) return false;
    this.shieldTimer = 0; // Reset shield regen timer

    if (this.shield > 0) {
      if (this.shield >= amount) {
        this.shield -= amount;
        amount = 0;
      } else {
        amount -= this.shield;
        this.shield = 0;
      }
      window.soundManager.playHit();
    }

    if (amount > 0) {
      this.health -= amount;
      window.soundManager.playExplosion(0.8);
      this.invulnerableTimer = 35; // Brief invulnerability
    }

    if (this.health <= 0) {
      this.health = 0;
      return true; // Destroyed
    }
    return false;
  }

  draw(ctx, timestamp) {
    if (this.invulnerableTimer > 0 && Math.floor(timestamp / 60) % 2 === 0) {
      // Blinking when invulnerable
      return;
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.tilt);

    // Draw Shield Bubble if active
    if (this.shield > 0) {
      const shieldAlpha = Math.min(0.7, (this.shield / this.maxShield) * 0.7);
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 10, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 240, 255, ${shieldAlpha})`;
      ctx.lineWidth = 2;
      ctx.fillStyle = `rgba(0, 240, 255, ${shieldAlpha * 0.12})`;
      ctx.fill();
      ctx.stroke();
    }

    // Ship Body - Sleek Futuristic Interceptor
    ctx.beginPath();
    ctx.moveTo(0, -this.radius - 6); // Nose
    ctx.lineTo(this.radius + 4, this.radius + 2); // Right wing tip
    ctx.lineTo(this.radius - 4, this.radius - 2); // Wing indent
    ctx.lineTo(0, this.radius - 4); // Rear center
    ctx.lineTo(-this.radius + 4, this.radius - 2); // Left wing indent
    ctx.lineTo(-this.radius - 4, this.radius + 2); // Left wing tip
    ctx.closePath();

    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Ship cockpit & neon accents
    ctx.beginPath();
    ctx.moveTo(0, -this.radius + 2);
    ctx.lineTo(4, 2);
    ctx.lineTo(0, 5);
    ctx.lineTo(-4, 2);
    ctx.closePath();
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.fill();

    // Wing cannons if upgraded
    if (this.weaponLevel >= 2) {
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-this.radius - 3, 0, 3, 10);
      ctx.fillRect(this.radius, 0, 3, 10);
    }

    ctx.restore();

    // Draw Support Drones
    if (this.drones > 0) {
      for (let i = 0; i < this.drones; i++) {
        const angle = (timestamp / 500) + (i * (Math.PI * 2 / this.drones));
        const droneDist = this.radius + 28;
        const dx = this.x + Math.cos(angle) * droneDist;
        const dy = this.y + Math.sin(angle) * (droneDist * 0.65);

        ctx.save();
        ctx.translate(dx, dy);
        ctx.fillStyle = '#00ff88';
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}

class Projectile {
  constructor(x, y, vx, vy, damage = 20, isEnemy = false, type = 'laser') {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.isEnemy = isEnemy;
    this.type = type;
    this.radius = type === 'plasma' ? 8 : (type === 'boss_orb' ? 9 : 4);
    this.dead = false;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

  draw(ctx) {
    ctx.save();
    if (this.isEnemy) {
      if (this.type === 'boss_orb') {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ff0055';
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ff3366';
        ctx.shadowColor = '#ff3366';
        ctx.shadowBlur = 8;
        ctx.fill();
      }
    } else {
      if (this.type === 'plasma') {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#00ff88';
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 14;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        // Player Laser Bolt
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.fillRect(this.x - 2, this.y - 10, 4, 18);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x - 1, this.y - 8, 2, 14);
      }
    }
    ctx.restore();
  }
}

class Enemy {
  constructor(x, y, type = 'scout', wave = 1) {
    this.x = x;
    this.y = y;
    this.type = type; // 'scout', 'interceptor', 'cruiser', 'boss'
    this.dead = false;
    this.shootTimer = Math.floor(Math.random() * 60);

    const waveScaling = 1 + (wave - 1) * 0.15;

    switch (type) {
      case 'scout':
        this.radius = 16;
        this.health = Math.round(25 * waveScaling);
        this.maxHealth = this.health;
        this.speed = 2.2 + Math.random() * 0.8;
        this.scoreVal = 100;
        this.color = '#ef4444';
        this.sinOffset = Math.random() * Math.PI * 2;
        this.sinSpeed = 0.04;
        this.sinAmp = 2;
        break;

      case 'interceptor':
        this.radius = 18;
        this.health = Math.round(45 * waveScaling);
        this.maxHealth = this.health;
        this.speed = 3.6 + Math.random() * 0.6;
        this.scoreVal = 200;
        this.color = '#f59e0b';
        this.sinOffset = Math.random() * Math.PI * 2;
        this.sinSpeed = 0.08;
        this.sinAmp = 3.5;
        break;

      case 'cruiser':
        this.radius = 28;
        this.health = Math.round(140 * waveScaling);
        this.maxHealth = this.health;
        this.speed = 1.1;
        this.scoreVal = 450;
        this.color = '#a855f7';
        this.shootInterval = 90;
        break;

      case 'boss':
        this.radius = 55;
        this.health = Math.round(1200 * (1 + (wave / 5) * 0.8));
        this.maxHealth = this.health;
        this.speed = 1.2;
        this.scoreVal = 3000;
        this.color = '#ec4899';
        this.targetY = 120;
        this.phase = 0;
        this.angle = 0;
        break;
    }
  }

  update(player, projectiles) {
    switch (this.type) {
      case 'scout':
        this.y += this.speed;
        this.sinOffset += this.sinSpeed;
        this.x += Math.sin(this.sinOffset) * this.sinAmp;
        
        // Random light shot
        this.shootTimer++;
        if (this.shootTimer >= 140 && Math.random() < 0.4) {
          this.shootTimer = 0;
          projectiles.push(new Projectile(this.x, this.y + this.radius, 0, 4.5, 12, true));
          window.soundManager.playEnemyLaser();
        }
        break;

      case 'interceptor':
        this.y += this.speed;
        this.sinOffset += this.sinSpeed;
        this.x += Math.cos(this.sinOffset) * this.sinAmp;
        
        this.shootTimer++;
        if (this.shootTimer >= 100) {
          this.shootTimer = 0;
          // Aim towards player
          const angle = Math.atan2(player.y - this.y, player.x - this.x);
          const pSpeed = 5;
          projectiles.push(new Projectile(this.x, this.y + this.radius, Math.cos(angle) * pSpeed, Math.sin(angle) * pSpeed, 15, true));
          window.soundManager.playEnemyLaser();
        }
        break;

      case 'cruiser':
        this.y += this.speed;
        this.shootTimer++;
        if (this.shootTimer >= (this.shootInterval || 90)) {
          this.shootTimer = 0;
          // Triple pulse
          projectiles.push(new Projectile(this.x - 12, this.y + 15, -1.2, 4.5, 15, true));
          projectiles.push(new Projectile(this.x, this.y + 20, 0, 5, 18, true));
          projectiles.push(new Projectile(this.x + 12, this.y + 15, 1.2, 4.5, 15, true));
          window.soundManager.playEnemyLaser();
        }
        break;

      case 'boss':
        // Move to target Y and hover side to side
        if (this.y < this.targetY) {
          this.y += this.speed;
        } else {
          this.angle += 0.025;
          this.x += Math.sin(this.angle) * 2.5;
        }

        this.shootTimer++;
        if (this.shootTimer % 45 === 0) {
          // Rapid alternating wing cannons
          projectiles.push(new Projectile(this.x - 38, this.y + 20, -0.8, 5, 15, true));
          projectiles.push(new Projectile(this.x + 38, this.y + 20, 0.8, 5, 15, true));
          window.soundManager.playEnemyLaser();
        }

        if (this.shootTimer >= 160) {
          this.shootTimer = 0;
          // Boss Heavy Orb burst or spiral
          for (let i = -2; i <= 2; i++) {
            const angle = Math.PI / 2 + (i * 0.28);
            projectiles.push(new Projectile(this.x, this.y + 40, Math.cos(angle) * 4.5, Math.sin(angle) * 4.5, 25, true, 'boss_orb'));
          }
          window.soundManager.playExplosion(1.2);
        }
        break;
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.dead = true;
      return true;
    }
    return false;
  }

  draw(ctx, timestamp) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.type === 'boss') {
      // Massive Boss Mothership Rendering
      ctx.fillStyle = '#1e1b4b';
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 3;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 15;

      ctx.beginPath();
      ctx.moveTo(0, 45); // Central beak
      ctx.lineTo(45, 15);
      ctx.lineTo(60, -30);
      ctx.lineTo(35, -45);
      ctx.lineTo(0, -25);
      ctx.lineTo(-35, -45);
      ctx.lineTo(-60, -30);
      ctx.lineTo(-45, 15);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Glowing pulsating core
      const pulse = Math.sin(timestamp / 150) * 4;
      ctx.beginPath();
      ctx.arc(0, 0, 16 + pulse, 0, Math.PI * 2);
      ctx.fillStyle = '#ff0055';
      ctx.fill();

    } else if (this.type === 'cruiser') {
      // Heavy Cruiser
      ctx.fillStyle = '#18181b';
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.moveTo(0, 24);
      ctx.lineTo(26, 6);
      ctx.lineTo(18, -20);
      ctx.lineTo(-18, -20);
      ctx.lineTo(-26, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Core lights
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(0, 2, 6, 0, Math.PI * 2);
      ctx.fill();

    } else if (this.type === 'interceptor') {
      // Sleek Dart
      ctx.fillStyle = '#1c1917';
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 6;

      ctx.beginPath();
      ctx.moveTo(0, 18);
      ctx.lineTo(16, -14);
      ctx.lineTo(0, -6);
      ctx.lineTo(-16, -14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

    } else {
      // Scout Drone
      ctx.fillStyle = '#111827';
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 14);
      ctx.lineTo(12, -10);
      ctx.lineTo(-12, -10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Health bar for cruisers and boss
    if ((this.type === 'cruiser' || this.type === 'boss') && this.health < this.maxHealth) {
      const barW = this.radius * 1.6;
      const barH = 5;
      const pct = Math.max(0, this.health / this.maxHealth);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(-barW / 2, -this.radius - 12, barW, barH);
      ctx.fillStyle = this.type === 'boss' ? '#ec4899' : '#a855f7';
      ctx.fillRect(-barW / 2, -this.radius - 12, barW * pct, barH);
    }

    ctx.restore();
  }
}

class Asteroid {
  constructor(x, y, size = 'large') {
    this.x = x;
    this.y = y;
    this.size = size; // 'large', 'medium', 'small'
    this.dead = false;

    if (size === 'large') {
      this.radius = 32;
      this.health = 80;
      this.speed = 1.2 + Math.random() * 0.8;
      this.scoreVal = 80;
    } else if (size === 'medium') {
      this.radius = 20;
      this.health = 40;
      this.speed = 1.8 + Math.random() * 1.0;
      this.scoreVal = 40;
    } else {
      this.radius = 12;
      this.health = 20;
      this.speed = 2.4 + Math.random() * 1.2;
      this.scoreVal = 20;
    }

    this.vx = (Math.random() - 0.5) * 1.2;
    this.vy = this.speed;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.04;

    // Generate jagged asteroid polygon vertices
    this.vertices = [];
    const points = 8 + Math.floor(Math.random() * 4);
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const r = this.radius * (0.75 + Math.random() * 0.5);
      this.vertices.push({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r
      });
    }
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotSpeed;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    ctx.beginPath();
    ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
    for (let i = 1; i < this.vertices.length; i++) {
      ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
    }
    ctx.closePath();

    ctx.fillStyle = '#27272a';
    ctx.fill();
    ctx.strokeStyle = '#71717a';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }
}

class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.radius = 14;
    this.type = type; // 'triple_shot', 'rapid_fire', 'shield_boost', 'emp_bomb', 'repair', 'drone'
    this.vy = 1.6;
    this.dead = false;
    this.pulse = 0;
  }

  update(player) {
    this.y += this.vy;
    this.pulse += 0.06;

    // Magnetism toward player
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < player.magnetRadius) {
      const force = (player.magnetRadius - dist) / player.magnetRadius;
      this.x += (dx / dist) * force * 7;
      this.y += (dy / dist) * force * 7;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    let color = '#00f0ff';
    let icon = '★';

    switch (this.type) {
      case 'triple_shot':
        color = '#38bdf8';
        icon = 'III';
        break;
      case 'rapid_fire':
        color = '#f59e0b';
        icon = '⚡';
        break;
      case 'shield_boost':
        color = '#00f0ff';
        icon = '🛡';
        break;
      case 'emp_bomb':
        color = '#ec4899';
        icon = '💣';
        break;
      case 'repair':
        color = '#22c55e';
        icon = '✚';
        break;
      case 'drone':
        color = '#a855f7';
        icon = '🛸';
        break;
    }

    const scale = 1 + Math.sin(this.pulse) * 0.15;
    ctx.scale(scale, scale);

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, 0, 1);

    ctx.restore();
  }
}

class ScrapGem {
  constructor(x, y, value = 10) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.radius = 6;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = Math.random() * 1.5 + 1;
    this.dead = false;
  }

  update(player) {
    this.x += this.vx;
    this.y += this.vy;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < player.magnetRadius + 30) {
      const force = (player.magnetRadius + 30 - dist) / (player.magnetRadius + 30);
      this.x += (dx / dist) * force * 8;
      this.y += (dy / dist) * force * 8;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = '#ffd000';
    ctx.shadowColor = '#ffd000';
    ctx.shadowBlur = 6;

    ctx.beginPath();
    ctx.moveTo(0, -this.radius);
    ctx.lineTo(this.radius, 0);
    ctx.lineTo(0, this.radius);
    ctx.lineTo(-this.radius, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
