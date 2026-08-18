// Galaxy Defender - Main Game Engine
class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    this.width = 640;
    this.height = 800;
    this.resizeCanvas();

    this.state = 'start'; // 'start', 'playing', 'paused', 'shop', 'game_over'
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('galaxy_defender_highscore') || '0', 10);
    this.scrap = 0;
    this.wave = 1;
    this.combo = 0;
    this.comboMultiplier = 1;
    this.comboTimer = 0;

    // Upgrades tracking
    this.upgrades = {
      damage: 1,
      fireRate: 1,
      maxShield: 1,
      drones: 0
    };

    this.player = new Player(this.width / 2, this.height - 100);
    this.projectiles = [];
    this.enemies = [];
    this.asteroids = [];
    this.powerups = [];
    this.scraps = [];

    // Wave spawning state
    this.waveEnemiesTotal = 0;
    this.waveEnemiesSpawned = 0;
    this.waveSpawnTimer = 0;
    this.waveClearTimer = 0;
    this.isBossWave = false;

    // Inputs
    this.keys = {};
    this.mouse = { x: null, y: null, down: false };
    this.touchActive = false;
    this.autoFire = true;

    // Visual Polish
    this.screenShake = 0;
    this.lastTime = 0;

    this.initEventListeners();
    window.particleSystem.initStars(this.width, this.height);
    this.updateHUD();

    // Start Animation Loop
    requestAnimationFrame((t) => this.loop(t));
  }

  resizeCanvas() {
    const container = document.getElementById('game-container');
    const rect = container.getBoundingClientRect();
    this.width = Math.min(680, Math.floor(rect.width));
    this.height = Math.floor(rect.height);

    this.canvas.width = this.width;
    this.canvas.height = this.height;

    if (window.particleSystem) {
      window.particleSystem.initStars(this.width, this.height);
    }
  }

  initEventListeners() {
    window.addEventListener('resize', () => this.resizeCanvas());

    // Keyboard
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (this.state === 'playing') this.pauseGame();
        else if (this.state === 'paused') this.resumeGame();
      }

      if (e.code === 'KeyE' || e.code === 'KeyB' || e.code === 'KeyX') {
        this.triggerEMP();
      }

      if (e.code === 'Space') {
        window.soundManager.init();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Mouse & Touch Controls
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - rect.left) * (this.width / rect.width),
        y: (clientY - rect.top) * (this.height / rect.height)
      };
    };

    this.canvas.addEventListener('mousedown', (e) => {
      window.soundManager.init();
      const pos = getPos(e);
      this.mouse.x = pos.x;
      this.mouse.y = pos.y;
      this.mouse.down = true;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const pos = getPos(e);
      this.mouse.x = pos.x;
      this.mouse.y = pos.y;
    });

    window.addEventListener('mouseup', () => {
      this.mouse.down = false;
    });

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      window.soundManager.init();
      this.touchActive = true;
      const pos = getPos(e);
      this.mouse.x = pos.x;
      this.mouse.y = pos.y;
      this.mouse.down = true;
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const pos = getPos(e);
      this.mouse.x = pos.x;
      this.mouse.y = pos.y;
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.mouse.down = false;
    }, { passive: false });

    // UI Buttons
    document.getElementById('start-btn').addEventListener('click', () => {
      window.soundManager.init();
      this.startNewGame();
    });

    document.getElementById('restart-btn').addEventListener('click', () => {
      window.soundManager.init();
      this.startNewGame();
    });

    document.getElementById('resume-btn').addEventListener('click', () => {
      this.resumeGame();
    });

    document.getElementById('pause-btn').addEventListener('click', () => {
      if (this.state === 'playing') this.pauseGame();
      else if (this.state === 'paused') this.resumeGame();
    });

    document.getElementById('sound-btn').addEventListener('click', () => {
      window.soundManager.init();
      const enabled = window.soundManager.toggle();
      document.getElementById('sound-btn').textContent = enabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
    });

    document.getElementById('emp-btn').addEventListener('click', () => {
      this.triggerEMP();
    });

    document.getElementById('next-wave-btn').addEventListener('click', () => {
      this.closeShopAndNextWave();
    });

    // Shop Upgrade Buttons
    document.querySelectorAll('.shop-item-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const upgradeType = e.currentTarget.dataset.upgrade;
        this.buyUpgrade(upgradeType);
      });
    });
  }

  startNewGame() {
    this.score = 0;
    this.scrap = 0;
    this.wave = 1;
    this.combo = 0;
    this.comboMultiplier = 1;
    this.comboTimer = 0;

    this.upgrades = {
      damage: 1,
      fireRate: 1,
      maxShield: 1,
      drones: 0
    };

    this.projectiles = [];
    this.enemies = [];
    this.asteroids = [];
    this.powerups = [];
    this.scraps = [];
    window.particleSystem.clear();

    this.player.reset(this.width / 2, this.height - 100);
    this.applyUpgradesToPlayer();

    this.setupWave();

    this.state = 'playing';
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('pause-screen').classList.add('hidden');
    document.getElementById('shop-modal').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');

    this.updateHUD();
  }

  pauseGame() {
    if (this.state === 'playing') {
      this.state = 'paused';
      document.getElementById('pause-screen').classList.remove('hidden');
    }
  }

  resumeGame() {
    if (this.state === 'paused') {
      this.state = 'playing';
      document.getElementById('pause-screen').classList.add('hidden');
    }
  }

  setupWave() {
    this.isBossWave = (this.wave % 5 === 0);
    this.waveEnemiesTotal = this.isBossWave ? 1 : (8 + this.wave * 3);
    this.waveEnemiesSpawned = 0;
    this.waveSpawnTimer = 30;
    this.waveClearTimer = 0;

    window.particleSystem.addText(`WAVE ${this.wave}`, this.width / 2, this.height / 2 - 40, '#00f0ff', 28);
    if (this.isBossWave) {
      window.particleSystem.addText(`WARNING: BOSS DETECTED!`, this.width / 2, this.height / 2 + 10, '#ff0055', 20);
      window.soundManager.playEMP();
    }
  }

  openShop() {
    this.state = 'shop';
    this.updateShopUI();
    document.getElementById('shop-modal').classList.remove('hidden');
  }

  closeShopAndNextWave() {
    document.getElementById('shop-modal').classList.add('hidden');
    this.wave++;
    this.setupWave();
    this.state = 'playing';
    this.updateHUD();
  }

  getUpgradeCost(type) {
    const level = this.upgrades[type];
    if (type === 'drones') return (level + 1) * 75;
    return level * 35;
  }

  buyUpgrade(type) {
    const cost = this.getUpgradeCost(type);
    if (this.scrap >= cost) {
      if (type === 'drones' && this.upgrades.drones >= 3) return;
      if (this.upgrades[type] >= 5 && type !== 'drones') return;

      this.scrap -= cost;
      this.upgrades[type]++;
      this.applyUpgradesToPlayer();
      window.soundManager.playPowerup();
      this.updateShopUI();
      this.updateHUD();
    }
  }

  applyUpgradesToPlayer() {
    this.player.damageMultiplier = 1 + (this.upgrades.damage - 1) * 0.3;
    this.player.fireRate = Math.max(5, 12 - (this.upgrades.fireRate - 1) * 1.5);
    this.player.maxShield = 50 + (this.upgrades.maxShield - 1) * 25;
    this.player.shield = Math.min(this.player.maxShield, this.player.shield + 25);
    this.player.drones = this.upgrades.drones;
  }

  updateShopUI() {
    document.getElementById('shop-scrap-count').textContent = this.scrap;

    const upgradesList = ['damage', 'fireRate', 'maxShield', 'drones'];
    upgradesList.forEach(key => {
      const level = this.upgrades[key];
      const maxLvl = key === 'drones' ? 3 : 5;
      const cost = this.getUpgradeCost(key);
      const isMax = level >= maxLvl;

      const lvlEl = document.getElementById(`lvl-${key}`);
      const btnEl = document.getElementById(`btn-${key}`);

      if (lvlEl) lvlEl.textContent = `Lvl ${level}/${maxLvl}`;
      if (btnEl) {
        if (isMax) {
          btnEl.textContent = 'MAXED';
          btnEl.disabled = true;
        } else {
          btnEl.textContent = `${cost} Scrap`;
          btnEl.disabled = this.scrap < cost;
        }
      }
    });
  }

  triggerEMP() {
    if (this.player.bombs > 0 && this.state === 'playing') {
      this.player.bombs--;
      window.soundManager.playEMP();
      this.addScreenShake(18);

      // Destroy enemy projectiles
      for (let p of this.projectiles) {
        if (p.isEnemy) {
          window.particleSystem.addHitSparks(p.x, p.y, '#00f0ff', 4);
          p.dead = true;
        }
      }

      // Damage all enemies heavily
      for (let enemy of this.enemies) {
        window.particleSystem.addExplosion(enemy.x, enemy.y, '#00f0ff', 18, 3);
        const destroyed = enemy.takeDamage(350);
        if (destroyed) this.onEnemyKilled(enemy);
      }

      // Clear small/medium asteroids
      for (let ast of this.asteroids) {
        ast.dead = true;
        window.particleSystem.addExplosion(ast.x, ast.y, '#94a3b8', 12, 2);
      }

      window.particleSystem.addText('EMP BLAST!', this.width / 2, this.height / 2, '#00f0ff', 24);
      this.updateHUD();
    }
  }

  addScreenShake(intensity) {
    this.screenShake = Math.max(this.screenShake, intensity);
  }

  firePlayerGuns() {
    if (this.player.fireCooldown > 0) return;
    this.player.fireCooldown = this.player.fireRate;

    const dmg = 22 * this.player.damageMultiplier;
    const speed = -this.player.bulletSpeed;

    switch (this.player.weaponLevel) {
      case 1:
        // Single Center Bolt
        this.projectiles.push(new Projectile(this.player.x, this.player.y - 18, 0, speed, dmg));
        window.soundManager.playLaser(880);
        break;

      case 2:
        // Dual Lasers
        this.projectiles.push(new Projectile(this.player.x - 10, this.player.y - 12, 0, speed, dmg));
        this.projectiles.push(new Projectile(this.player.x + 10, this.player.y - 12, 0, speed, dmg));
        window.soundManager.playLaser(920);
        break;

      case 3:
        // Triple Spread
        this.projectiles.push(new Projectile(this.player.x, this.player.y - 18, 0, speed, dmg));
        this.projectiles.push(new Projectile(this.player.x - 12, this.player.y - 10, -2, speed * 0.95, dmg * 0.9));
        this.projectiles.push(new Projectile(this.player.x + 12, this.player.y - 10, 2, speed * 0.95, dmg * 0.9));
        window.soundManager.playLaser(960, true);
        break;

      case 4:
        // Quad Blaster
        this.projectiles.push(new Projectile(this.player.x - 6, this.player.y - 18, 0, speed, dmg));
        this.projectiles.push(new Projectile(this.player.x + 6, this.player.y - 18, 0, speed, dmg));
        this.projectiles.push(new Projectile(this.player.x - 16, this.player.y - 8, -2.5, speed * 0.9, dmg * 0.85));
        this.projectiles.push(new Projectile(this.player.x + 16, this.player.y - 8, 2.5, speed * 0.9, dmg * 0.85));
        window.soundManager.playLaser(1020, true);
        break;

      default:
        // Plasma Spread Cannon
        this.projectiles.push(new Projectile(this.player.x, this.player.y - 20, 0, speed * 1.1, dmg * 1.4, false, 'plasma'));
        this.projectiles.push(new Projectile(this.player.x - 14, this.player.y - 10, -3.2, speed * 0.9, dmg * 0.9));
        this.projectiles.push(new Projectile(this.player.x + 14, this.player.y - 10, 3.2, speed * 0.9, dmg * 0.9));
        this.projectiles.push(new Projectile(this.player.x - 22, this.player.y - 4, -5, speed * 0.8, dmg * 0.8));
        this.projectiles.push(new Projectile(this.player.x + 22, this.player.y - 4, 5, speed * 0.8, dmg * 0.8));
        window.soundManager.playLaser(1100, true);
        break;
    }

    // Support Drones Fire
    if (this.player.drones > 0) {
      for (let i = 0; i < this.player.drones; i++) {
        const angle = (performance.now() / 500) + (i * (Math.PI * 2 / this.player.drones));
        const droneDist = this.player.radius + 28;
        const dx = this.player.x + Math.cos(angle) * droneDist;
        const dy = this.player.y + Math.sin(angle) * (droneDist * 0.65);
        this.projectiles.push(new Projectile(dx, dy - 8, 0, -12, dmg * 0.5));
      }
    }
  }

  onEnemyKilled(enemy) {
    const pts = Math.round(enemy.scoreVal * this.comboMultiplier);
    this.score += pts;
    this.combo++;
    this.comboTimer = 180; // 3 seconds to maintain combo
    this.comboMultiplier = Math.min(5, 1 + Math.floor(this.combo / 5) * 0.5);

    window.particleSystem.addText(`+${pts}`, enemy.x, enemy.y - 10, '#ffd000', 14);

    // Drop Scrap
    const scrapCount = enemy.type === 'boss' ? 25 : enemy.type === 'cruiser' ? 6 : Math.random() < 0.6 ? 2 : 1;
    for (let s = 0; s < scrapCount; s++) {
      this.scraps.push(new ScrapGem(enemy.x + (Math.random() - 0.5) * 20, enemy.y + (Math.random() - 0.5) * 20));
    }

    // Powerup drop chance
    const dropRate = enemy.type === 'boss' ? 1 : enemy.type === 'cruiser' ? 0.65 : 0.12;
    if (Math.random() < dropRate) {
      const types = ['triple_shot', 'rapid_fire', 'shield_boost', 'emp_bomb', 'repair'];
      const chosen = types[Math.floor(Math.random() * types.length)];
      this.powerups.push(new PowerUp(enemy.x, enemy.y, chosen));
    }

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('galaxy_defender_highscore', this.highScore.toString());
    }

    this.updateHUD();
  }

  gameOver() {
    this.state = 'game_over';
    this.addScreenShake(25);
    window.soundManager.playExplosion(2);

    document.getElementById('final-score').textContent = this.score;
    document.getElementById('final-wave').textContent = this.wave;
    document.getElementById('game-over-screen').classList.remove('hidden');
  }

  update(timestamp) {
    if (this.state !== 'playing') return;

    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake *= 0.9;
      if (this.screenShake < 0.2) this.screenShake = 0;
    }

    // Combo Timer Decay
    if (this.comboTimer > 0) {
      this.comboTimer--;
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.comboMultiplier = 1;
        this.updateHUD();
      }
    }

    // Player Shooting (auto-fire or space/click)
    if (this.autoFire || this.keys['Space'] || this.mouse.down) {
      this.firePlayerGuns();
    }

    // Update Player
    this.player.update(this.keys, this.mouse, this.touchActive, this.width, this.height);

    // Spawning Enemies
    if (this.waveEnemiesSpawned < this.waveEnemiesTotal) {
      this.waveSpawnTimer--;
      if (this.waveSpawnTimer <= 0) {
        this.waveSpawnTimer = Math.max(25, 80 - this.wave * 4);

        if (this.isBossWave) {
          this.enemies.push(new Enemy(this.width / 2, -60, 'boss', this.wave));
          this.waveEnemiesSpawned = this.waveEnemiesTotal;
        } else {
          const spawnX = 40 + Math.random() * (this.width - 80);
          let type = 'scout';
          const r = Math.random();

          if (this.wave >= 4 && r < 0.25) type = 'cruiser';
          else if (this.wave >= 2 && r < 0.55) type = 'interceptor';

          this.enemies.push(new Enemy(spawnX, -30, type, this.wave));
          this.waveEnemiesSpawned++;
        }
      }
    }

    // Random Asteroid Spawns
    if (Math.random() < 0.015 + (this.wave * 0.002) && this.asteroids.length < 5) {
      const size = Math.random() < 0.5 ? 'large' : 'medium';
      this.asteroids.push(new Asteroid(Math.random() * this.width, -40, size));
    }

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update();

      // Bounds
      if (p.x < -20 || p.x > this.width + 20 || p.y < -30 || p.y > this.height + 30) {
        this.projectiles.splice(i, 1);
        continue;
      }

      if (p.dead) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check player hits by enemy bullets
      if (p.isEnemy) {
        const dist = Math.hypot(this.player.x - p.x, this.player.y - p.y);
        if (dist < this.player.radius + p.radius) {
          p.dead = true;
          window.particleSystem.addHitSparks(p.x, p.y, '#ff3366', 6);
          const destroyed = this.player.takeDamage(p.damage);
          this.addScreenShake(6);
          this.updateHUD();
          if (destroyed) {
            this.gameOver();
            return;
          }
        }
      } else {
        // Player laser hitting enemies
        for (let enemy of this.enemies) {
          const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
          if (dist < enemy.radius + p.radius) {
            p.dead = true;
            window.particleSystem.addHitSparks(p.x, p.y, '#00f0ff', 5);
            const killed = enemy.takeDamage(p.damage);
            if (killed) {
              window.particleSystem.addExplosion(enemy.x, enemy.y, enemy.color, enemy.type === 'boss' ? 50 : 25, enemy.type === 'boss' ? 7 : 4);
              window.soundManager.playExplosion(enemy.type === 'boss' ? 2.5 : 1);
              this.addScreenShake(enemy.type === 'boss' ? 15 : 4);
              this.onEnemyKilled(enemy);
            } else {
              window.soundManager.playHit();
            }
            break;
          }
        }

        // Player laser hitting asteroids
        for (let ast of this.asteroids) {
          const dist = Math.hypot(ast.x - p.x, ast.y - p.y);
          if (dist < ast.radius + p.radius) {
            p.dead = true;
            window.particleSystem.addHitSparks(p.x, p.y, '#a1a1aa', 4);
            ast.health -= p.damage;
            if (ast.health <= 0) {
              ast.dead = true;
              window.particleSystem.addExplosion(ast.x, ast.y, '#71717a', 15, 3);
              window.soundManager.playExplosion(0.8);
              this.score += ast.scoreVal;

              // Break down into smaller asteroids
              if (ast.size === 'large') {
                this.asteroids.push(new Asteroid(ast.x - 10, ast.y, 'medium'));
                this.asteroids.push(new Asteroid(ast.x + 10, ast.y, 'medium'));
              } else if (ast.size === 'medium') {
                this.asteroids.push(new Asteroid(ast.x - 5, ast.y, 'small'));
                this.asteroids.push(new Asteroid(ast.x + 5, ast.y, 'small'));
              }
              this.scraps.push(new ScrapGem(ast.x, ast.y));
              this.updateHUD();
            }
            break;
          }
        }
      }
    }

    // Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(this.player, this.projectiles);

      // Collision with player
      const dist = Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y);
      if (dist < this.player.radius + enemy.radius) {
        const destroyed = this.player.takeDamage(enemy.type === 'boss' ? 60 : 30);
        this.addScreenShake(10);
        if (enemy.type !== 'boss') {
          enemy.dead = true;
          window.particleSystem.addExplosion(enemy.x, enemy.y, enemy.color, 20, 3.5);
        }
        this.updateHUD();
        if (destroyed) {
          this.gameOver();
          return;
        }
      }

      if (enemy.dead || enemy.y > this.height + 60) {
        this.enemies.splice(i, 1);
      }
    }

    // Update Asteroids
    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      const ast = this.asteroids[i];
      ast.update();

      // Asteroid collision with player
      const dist = Math.hypot(this.player.x - ast.x, this.player.y - ast.y);
      if (dist < this.player.radius + ast.radius) {
        ast.dead = true;
        const destroyed = this.player.takeDamage(35);
        window.particleSystem.addExplosion(ast.x, ast.y, '#71717a', 15, 3);
        this.addScreenShake(8);
        this.updateHUD();
        if (destroyed) {
          this.gameOver();
          return;
        }
      }

      if (ast.dead || ast.y > this.height + 60) {
        this.asteroids.splice(i, 1);
      }
    }

    // Update PowerUps
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const pu = this.powerups[i];
      pu.update(this.player);

      const dist = Math.hypot(this.player.x - pu.x, this.player.y - pu.y);
      if (dist < this.player.radius + pu.radius) {
        window.soundManager.playPowerup();
        window.particleSystem.addHitSparks(pu.x, pu.y, '#00ff88', 12);

        switch (pu.type) {
          case 'triple_shot':
          case 'rapid_fire':
            this.player.weaponLevel = Math.min(5, this.player.weaponLevel + 1);
            window.particleSystem.addText(`WEAPON UPGRADE! LVL ${this.player.weaponLevel}`, this.player.x, this.player.y - 30, '#00f0ff', 16);
            break;
          case 'shield_boost':
            this.player.shield = this.player.maxShield;
            window.particleSystem.addText('SHIELD OVERCHARGED!', this.player.x, this.player.y - 30, '#38bdf8', 16);
            break;
          case 'emp_bomb':
            this.player.bombs = Math.min(this.player.maxBombs, this.player.bombs + 1);
            window.particleSystem.addText('+1 EMP BOMB', this.player.x, this.player.y - 30, '#ec4899', 16);
            break;
          case 'repair':
            this.player.health = Math.min(this.player.maxHealth, this.player.health + 40);
            window.particleSystem.addText('+40 HEALTH REPAIRED', this.player.x, this.player.y - 30, '#22c55e', 16);
            break;
        }

        this.powerups.splice(i, 1);
        this.updateHUD();
      } else if (pu.y > this.height + 30) {
        this.powerups.splice(i, 1);
      }
    }

    // Update Scrap Pickups
    for (let i = this.scraps.length - 1; i >= 0; i--) {
      const sc = this.scraps[i];
      sc.update(this.player);

      const dist = Math.hypot(this.player.x - sc.x, this.player.y - sc.y);
      if (dist < this.player.radius + sc.radius) {
        this.scrap += sc.value;
        this.scraps.splice(i, 1);
        this.updateHUD();
      } else if (sc.y > this.height + 30) {
        this.scraps.splice(i, 1);
      }
    }

    // Check Wave Completion
    if (this.waveEnemiesSpawned >= this.waveEnemiesTotal && this.enemies.length === 0) {
      this.waveClearTimer++;
      if (this.waveClearTimer === 1) {
        window.particleSystem.addText(`WAVE ${this.wave} CLEARED!`, this.width / 2, this.height / 2, '#00ff88', 26);
        window.soundManager.playPowerup();
      }

      if (this.waveClearTimer >= 90) {
        // Open Upgrade Shop between waves!
        this.openShop();
      }
    }

    // Update Particle System
    window.particleSystem.update(this.width, this.height, 1);
  }

  updateHUD() {
    // Health & Shield Bars
    const hpPct = Math.max(0, (this.player.health / this.player.maxHealth) * 100);
    const shPct = Math.max(0, (this.player.shield / this.player.maxShield) * 100);

    const hpBar = document.getElementById('hp-fill');
    const shBar = document.getElementById('shield-fill');
    if (hpBar) hpBar.style.width = `${hpPct}%`;
    if (shBar) shBar.style.width = `${shPct}%`;

    // Counters
    const scoreEl = document.getElementById('score-val');
    const highEl = document.getElementById('high-score-val');
    const waveEl = document.getElementById('wave-val');
    const scrapEl = document.getElementById('scrap-val');
    const bombsEl = document.getElementById('bombs-val');
    const comboEl = document.getElementById('combo-val');

    if (scoreEl) scoreEl.textContent = this.score;
    if (highEl) highEl.textContent = this.highScore;
    if (waveEl) waveEl.textContent = this.wave;
    if (scrapEl) scrapEl.textContent = this.scrap;
    if (bombsEl) bombsEl.textContent = '💣'.repeat(this.player.bombs);
    if (comboEl) {
      if (this.comboMultiplier > 1) {
        comboEl.textContent = `${this.comboMultiplier}x COMBO!`;
        comboEl.classList.add('active');
      } else {
        comboEl.textContent = '';
        comboEl.classList.remove('active');
      }
    }
  }

  render(timestamp) {
    this.ctx.save();

    // Clear
    this.ctx.fillStyle = '#08090d';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Apply Screen Shake
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      this.ctx.translate(shakeX, shakeY);
    }

    // Draw Particles & Stars
    window.particleSystem.draw(this.ctx, this.width, this.height);

    // Draw Entities
    for (let sc of this.scraps) sc.draw(this.ctx);
    for (let pu of this.powerups) pu.draw(this.ctx);
    for (let ast of this.asteroids) ast.draw(this.ctx);
    for (let p of this.projectiles) p.draw(this.ctx);
    for (let enemy of this.enemies) enemy.draw(this.ctx, timestamp);

    if (this.state === 'playing' || this.state === 'paused' || this.state === 'shop') {
      this.player.draw(this.ctx, timestamp);
    }

    this.ctx.restore();
  }

  loop(timestamp) {
    this.update(timestamp);
    this.render(timestamp);
    requestAnimationFrame((t) => this.loop(t));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
