(function () {
	var ctx = null;

	window.requestAnimFrame = (function() {
		return window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame	||
		window.mozRequestAnimationFrame 		||
		window.oRequestAnimationFrame				||
		window.msRequestAnimationFrame			||
		function(callback) {
			window.setTimeout(callback, 1000 / 60);
		};
	})();

	var Game = {
		canvas: document.getElementById('canvas'),

		setup: function() {
			if (this.canvas.getContext) {
				ctx = this.canvas.getContext('2d');

				this.width = this.canvas.width;
				this.height = this.canvas.height;

				Screen.welcome();
				this.canvas.addEventListener('click', Game.runGame, false);
				Ctrl.init();
			}		
		},

		runGame: function() {
			Game.canvas.removeEventListener('click', Game.runGame, false); // Removes event listener from firing
			Game.init();

			Game.animate();
		},

		restartGame: function() {
			Game.canvas.removeEventListener('click', Game.restartGame, false);
			Game.init();
		},

		animate: function() {
			Game.play = requestAnimFrame(Game.animate); // I think this is the game loop
			Game.draw();
		},

		init: function() {
			Background.init();
			Hud.init();
			Ball.init();
			Paddle.init();
			Bricks.init();

		},

		draw: function() {
			ctx.clearRect(0, 0, this.width, this.height);

			Background.draw();
			Bricks.draw();
			Paddle.draw();
			Hud.draw();
			Ball.draw();
		},

		levelUp: function() {
			Hud.lv += 1;
			Bricks.init();
			Ball.init();
			Paddle.init();
		},

		levelLimit: function(lv) {
			return lv > 5 ? 5 : lv;
		}
	};

	var Background = {
		init: function() {
			this.ready = false;
			this.img = new Image();
			this.img.src = 'background.jpg';

			this.img.onload = function() {
				Background.ready = true;
			}; 
		},

		draw: function() {
			if (this.ready) {
				ctx.drawImage(this.img, 0, 0);
			}
		}
	};

	var Bricks = {
		gap: 2,
		col: 5,
		w: 80,
		h: 15,

		init: function(){
			this.row = 2 + Game.levelLimit(Hud.lv);
			this.total = 0;

			this.count = [this.row];
			for (var i = this.row; i--;){
				this.count[i] = [this.col];
			}
		},

		draw: function() {
			var i, j;

			for (i = this.row; i--;) {
				for (j = this.col; j--;) {
					if (this.count[i][j] !== false) {
						if (Ball.x >= this.x(j) && Ball.x <= (this.x(j) + this.w) && Ball.y >= this.y(i) && Ball.y <= (this.y(i) + this.h)) {
							this.collide(i, j);
							continue;
						}
						ctx.fillStyle = this.gradient(i);
						ctx.fillRect(this.x(j), this.y(i), this.w, this.h);
					}
				}
			}
			
			if (this.total === (this.row * this.col)) {
				Game.levelUp();
			}
		},

		collide: function(i, j) {
			Hud.score += 1;
			this.total += 1;
			this.count[i][j] = false;
			Ball.sy = -Ball.sy;
		},

		x: function(row) {
			return (row * this.w) + (row * this.gap);
		},

		y: function(col) {
			return (col * this.h) + (col * this.gap);
		},

		gradient: function(row) {
			switch(row) {
				case 0:
					return this.gradientPurple ? this.gradientPurple : this.gradientPurple = this.makeGradient(row, '#bd06f9', '#9604c7');
				case 1:
					return this.gradientRed ? this.gradientRed : this.gradientRed = this.makeGradient(row, '#F9064A', '#c7043b');
				case 2:
					return this.gradientGreen ? this.gradientGreen : this.gradientGreen = this.makeGradient(row, '#05fa15', '#04c711');
				case 3:
					return this.gradientOrange ? this.gradientOrange : this.gradientOrange = this.makeGradient(row, '#faa105', '#c77f04');
			}
		},

		makeGradient: function(row, color1, color2) {
			var y = this.y(row);
			var grad = ctx.createLinearGradient(0, y, 0, y + this.h);
			grad.addColorStop(0, color1);
			grad.addColorStop(1, color2);

			return grad;
		}

	};

	var Ball = {
		r: 10, // Ball's radius

		init: function() {
			this.x = 120; // X position of ball
			this.y = 120; // Y position of ball
			this.sx = 1 + (0.4 * Hud.lv); // Speed on x axis
			this.sy = -1.5 - (0.4 * Hud.lv); // Speed on y axis
		},

		draw: function() {
			this.edges();
			this.collide();
			this.move();

			ctx.beginPath();
			ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
			ctx.closePath();
			ctx.fillStyle = '#eee';
			ctx.fill();
		},

		edges: function() {
			if (this.y < 1) {
				this.y = 1;
				this.sy = -this.sy;
			} else if (this.y > Game.height) {
				this.sy = this.sx = 0;
				this.y = this.x = 1000;
				Screen.gameOver();
				canvas.addEventListener('click', Game.restartGame, false);
				return;
			}
			if (this.x < 1) {
				this.x = 1;
				this.sx = -this.sx;
			} else if (this.x > Game.width) {
				this.x = Game.width - 1;
				this.sx = -this.sx;
			}
		},
		collide: function() {
			if (this.x >= Paddle.x &&
			this.x <= (Paddle.x + Paddle.w) &&
			this.y >= Paddle.y &&
			this.y <= (Paddle.y + Paddle.h)) {
				this.sx = 7 * ((this.x - (Paddle.x + Paddle.w / 2)) / Paddle.w);
				this.sy = -this.sy;
				}
		},
		move: function() {
			this.x += this.sx;
			this.y += this.sy;
		}
	};

	var Paddle = {
		w: 90,
		h: 20,
		r: 9,

		init: function() {
			this.x = 100;
			this.y = 210;
			this.speed = 4;
		},

		draw: function() {
			this.move();

			ctx.beginPath();
			ctx.moveTo(this.x, this.y);
			ctx.arcTo(this.x + this.w, this.y, this.x + this.w, this.y + this.r, this.r);
			ctx.lineTo(this.x + this.w, this.y + this.h - this.r);
			ctx.arcTo(this.x + this.w, this.y + this.h, this.x + this.w - this.r, this.y + this.h, this.r);
			ctx.lineTo(this.x + this.r, this.y + this.h);
			ctx.arcTo(this.x, this.y + this.h, this.x, this.y + this.h - this.r, this.r);
			ctx.lineTo(this.x, this.y + this.r);
			ctx.arcTo(this.x, this.y, this.x + this.r, this.y, this.r);
			ctx.closePath();

			ctx.fillStyle = this.gradient();
			ctx.fill();
		},

		move: function() {
			if (Ctrl.left && (this.x < Game.width - (this.w / 2))) {
				this.x += this.speed;
			} else if (Ctrl.right && this.x > -this.w / 2) {
				this.x += -this.speed;
			}
			
		},

		gradient: function() {
			if (this.gradientCache) {
				return this.gradientCache;
			}
			
			this.gradientCache = ctx.createLinearGradient(this.x, this.y, this.x, this.y + 20);
			this.gradientCache.addColorStop(0, '#eee');
			this.gradientCache.addColorStop(1, '#999');

			return this.gradientCache;
		}
	};

	var Ctrl = {
		init: function() {
			window.addEventListener('keydown', this.keyDown, true);
			window.addEventListener('keyup', this.keyUp, true);
			window.addEventListener('mousemove', this.movePaddle, true);

			Game.canvas.addEventListener('touchstart', this.movePaddle, false);
			Game.canvas.addEventListener('touchmove', this.movePaddle, false);
			Game.canvas.addEventListener('touchmove', this.stopTouchScroll, false);
		},

		stopTouchScroll: function(event) {
			event.preventDefault(); // Disables touch scrolling, as it causes issues
		},

		movePaddle: function(event) {
			var mouseX = event.pageX; // X location of the mouse
			var canvasX = Game.canvas.offsetLeft; // Measurement from the left side of the browser window to the Canavs element in pixels

			var paddleMid = Paddle.w / 2;

			if (mouseX > canvasX && mouseX < canvasX + Game.width) { // Makes sure mouse is within the canvas's horizontal section
				var newX = mouseX - canvasX;
				newX -= paddleMid; // Offsets the paddle's new location so it lines up in the middle of the mouse

				Paddle.x = newX; // Hijacks the existing Paddle object and replaces the x coordinate
			}
		},

		keyDown: function(event) {
			switch(event.keyCode){
				case 39: // left-arrow key
					Ctrl.left = true;
					break;
				case 37:
					Ctrl.right = true;
					break;
				default:
					break;
			}
		},

		keyUp: function(event) {
			switch(event.keyCode){
				case 39: // right-arrow key
					Ctrl.left = false;
					break;
				case 37:
					Ctrl.right = false;
					break;
				default:
					break;
			}
		}
	};

	var Hud = {
		init: function() {
			this.lv = 1;
			this.score = 0;
		},

		draw: function(){
			ctx.font = '12px helvetica, arial';
			ctx.fillStyle = 'white';
			ctx.textAlign = 'left';
			ctx.fillText('Score: ' + this.score, 5, Game.height - 5); // Score text
			ctx.textAlign = 'right';
			ctx.fillText('Lv: ' + this.lv, Game.width - 5, Game.height - 5);  // Level text
		}
	};

	var Screen = {
		welcome: function() {
			this.text = 'CANVAS RICOCHET';
			this.textSub = 'Click to Start';
			this.textColor = 'white';

			this.create(); // Setup screen after initial properties have been set
		},

		gameOver: function() {
			this.text = 'Game Over';
			this.textSub = 'Click To Retry';
			this.textColor = 'red';

			this.create();
		},

		create: function() {
			ctx.fillStyle = 'black';
			ctx.fillRect(0, 0, Game.width, Game.height);

			ctx.fillStyle = this.textColor;
			ctx.textAlign = 'center';
			ctx.font = '40px helvetica, arial';
			ctx.fillText(this.text, Game.width / 2, Game.height / 2);

			ctx.fillStyle = '#999999';
			ctx.font = '20px helvetica, arial';
			ctx.fillText(this.textSub, Game.width / 2, Game.height /2 + 30);
		}
	};

	window.onload = function() {
		Game.setup();
	};
}());
