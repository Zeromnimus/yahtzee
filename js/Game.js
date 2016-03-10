WebFont.load({
        google: {
            families: ['Press+Start+2P']
        },
        active: function() {
            GameInitialize();
        }
    });

function GameInitialize() {
	var DEBUG_MODE = true, //рендерим отладочную информацию
	    SPEED = 180, //скорость полета птички
	    GRAVITY = 1800, //коэффициент гравитации в игровом мире
	    BIRD_FLAP = 550, //с каким ускорением птичка "взлетает"
	    PIPE_SPAWN_MIN_INTERVAL = 1200, //минимальная задержка перед следующей трубой
	    PIPE_SPAWN_MAX_INTERVAL = 3000, //максимальная задержка
	    AVAILABLE_SPACE_BETWEEN_PIPES = 130, //минимальное свободное пространство между трубами (по вертикали)
	    CLOUDS_SHOW_MIN_TIME = 3000, //минимальная задержка перед следующим облаком
	    CLOUDS_SHOW_MAX_TIME = 5000, //максимальная задержка перед следующим облаком
	    MAX_DIFFICULT = 100, //на основе этого коэффициента также вычисляется расстояние между трубами
	    SCENE = '', //идентификатор сцены, где нужно рендерить. В данном случае пусто (по умолчанию рендерит в body)
	    TITLE_TEXT = "FLAPPY BIRD", //Название игры в главном меню
	    HIGHSCORE_TITLE = "HIGHSCORES", //Название игрового меню
	    HIGHSCORE_SUBMIT = "POST SCORE", //Название кнопки в рекордах для сохранения своего рекорда
	    INSTRUCTIONS_TEXT = "TOUCH\nTO\nFLY", //Инструкция в главном меню
	    DEVELOPER_TEXT = "Developer\nEugene Obrezkov\nghaiklor@gmail.com", //Куда ж без копирайтов :)
	    GRAPHIC_TEXT = "Graphic\nDmitry Lezhenko\ndima.lezhenko@gmail.com",
	    LOADING_TEXT = "LOADING...", //Сообщение о загрузке игры
	    WINDOW_WIDTH = window.innerWidth || document.documentElement.clientWidth || document.getElementsByTagName('body')[0].clientWidth,
	    WINDOW_HEIGHT = window.innerHeight || document.documentElement.clientHeight || document.getElementsByTagName('body')[0].clientHeight;	
	var Background, //Игровой фон
	    Clouds, CloudsTimer, //Облака и таймер для спауна облаков
	    Pipes, PipesTimer, FreeSpacesInPipes, //Наши трубы, таймер и "прозрачный" объект, который будет "триггером" пролета
	    Bird, //Птичка
	    Town, //TileSprite города на фоне
	    FlapSound, ScoreSound, HurtSound, //Звуки взлета, пролета трубы и проигрыша
	    SoundEnabledIcon, SoundDisabledIcon, //Иконки включения\отключения звука
	    TitleText, DeveloperText, GraphicText, ScoreText, InstructionsText, HighScoreTitleText, HighScoreText, PostScoreText, LoadingText, //все текстовые объекты
	    PostScoreClickArea, //Зона клика для сохранения рекорда
	    isScorePosted = false, //Флаг для проверки, был ли рекорд "запостен"
	    isSoundEnabled = true, //Флаг для проверки, нужно ли воспроизводить звук
	    Leaderboard; //И собственно Leaderboard объект от Clay.io	    
	///////////////////////////////////////////////////////////////////////////
	//     Создаем instance игры на весь экран с использованием Canvas       //
	///////////////////////////////////////////////////////////////////////////
	var Game = new Phaser.Game(800, 600, Phaser.CANVAS, SCENE);
	    //Включаем поддержку RequestAnimationFrame
	    Game.raf = new Phaser.RequestAnimationFrame(Game);
	    Game.antialias = false;
	    Game.raf.start();
	///////////////////////////////////////////////////////////////////////////
	//                  Создаем instance BootGameState                       //
	///////////////////////////////////////////////////////////////////////////
	var BootGameState = new Phaser.State();
		BootGameState.preload = function() {
			Game.load.image('preloader','assets/cougar_dragonsun.png');
		}; // BootGameState.preload~
	    BootGameState.create = function() {
		    var preloader = Game.add.image(0, 0, 'preloader');
		    preloader.width = 800;
		    preloader.height = 600;	    	
	        LoadingText = Game.add.text(Game.world.width / 2, Game.world.height / 2, LOADING_TEXT, {
	            font: '32px "Press Start 2P"',
	            fill: '#FFFFFF',
	            stroke: '#000000',
	            strokeThickness: 3,
	            align: 'center'
	        });
	        LoadingText.anchor.setTo(0.5, 0.5);
	        Game.state.start('Preloader', false, false);
	    }; // BootGameState.create~

	var loadAssets = function loadAssets() {
		Game.load.image('bg','assets/sky.png');
		Game.load.image('star', 'assets/star.png');
		Game.load.image('phaser', 'assets/phaser.png');

		Game.load.bitmapFont('desyrel', 'assets/fonts/bitmapFonts/desyrel.png', 'assets/fonts/bitmapFonts/desyrel.xml');
		Game.load.bitmapFont('shortstack', 'assets/fonts/bitmapFonts/shortStack.png', 'assets/fonts/bitmapFonts/shortStack.xml');	
		
		Game.load.audio('menu_switch', 'assets/audio/menu_switch.mp3');	
		Game.load.audio('dollar_bound', 'assets/audio/lazer_wall_off.mp3');	
		Game.load.audio('bg_audio', 'assets/audio/bodenstaendig_2000_in_rock_4bit.mp3');	
	};	// loadAssets~
	///////////////////////////////////////////////////////////////////////////
	//                  Создаем instance PreloaderGameState                  //
	///////////////////////////////////////////////////////////////////////////
	var PreloaderGameState = new Phaser.State();	
		PreloaderGameState.preload = function() {
		    loadAssets();
		};	
		PreloaderGameState.create = function() {			
		    var tween = Game.add.tween(LoadingText).to({
		        alpha: 0
		    }, 1000, Phaser.Easing.Linear.None, true);

		    tween.onComplete.add(function() {
		        Game.state.start('MainMenu', false, false);
		    }, this);
		};	// PreloaderGameState~
	///////////////////////////////////////////////////////////////////////////
	//                  Создаем instance MainMenuState                       //
	///////////////////////////////////////////////////////////////////////////
	var MainMenuState = new Phaser.State();
		// for menu select
		var upKey, 
			downKey, 
			muteKey,
			enterKey;

		var star;
		var phaser;
		var starY = new Array (90,130,170,210,250);
		var stY = 0;

		var dollar;
		// for bg sound;
		var StaticText,
			CommentText;
		var menu_music;
		var music;
		var dollar_music;
		var SoundTrigger = true;
		// test var
		var i = 0;

		MainMenuState.create = function() {
			Game.physics.startSystem(Phaser.Physics.ARCADE);
			// *** build static scene ****
			var bg = Game.add.image(0,0,'bg');
		    	bg.width = 800;
		    	bg.height = 600;

			var bar = Game.add.graphics();
			    bar.beginFill(0x000000, 0.2);
			    bar.drawRect(0, 540, 800, 40);

			    music = Game.add.audio('bg_audio');
				music.volume = 0.2;
				menu_music = Game.add.audio('menu_switch');
				menu_music.volume = 0.5;
				dollar_music = Game.add.audio('dollar_bound');
				dollar_music.volume = 0.5;

			text = Game.add.bitmapText( (Game.world.width / 2) , 50, 'shortstack','$ Poker on Bones $',40);
			text.anchor.setTo(0.5,0.5);

			text = Game.add.bitmapText((Game.world.width / 2), 100, 'desyrel','Play',32);
			text.anchor.setTo(0.5,0.5);

			text = Game.add.bitmapText((Game.world.width / 2), 140, 'desyrel','Online Play',32);
			text.anchor.setTo(0.5,0.5);

			text = Game.add.bitmapText((Game.world.width / 2), 180, 'desyrel','Settings',32);
			text.anchor.setTo(0.5,0.5);

			text = Game.add.bitmapText((Game.world.width / 2), 220, 'desyrel','Rules',32);
			text.anchor.setTo(0.5,0.5);

			text = Game.add.bitmapText((Game.world.width / 2), 260, 'desyrel','About',32);	
			text.anchor.setTo(0.5,0.5);
			// jumping symbol Dollar
			dollar = Game.add.bitmapText(10, 10, 'shortstack', '$', 32);
			dollar2 = Game.add.bitmapText(10, 600, 'shortstack', '$', 32);

			Game.physics.arcade.enable( [dollar, dollar2] );
			dollar.body.velocity.setTo(200,200);
			dollar.body.collideWorldBounds = true;
			dollar.body.bounce.set(1);

			dollar2.body.velocity.setTo(-100,-100);
			dollar2.body.collideWorldBounds = true;
			dollar2.body.bounce.set(1);

			var	StaticText1 = Game.add.text( Game.world.width / 2, Game.world.height - 40, "Developer aka 'Zerom' 2016 (c)", {
		            font: '8px "Press Start 2P"',
		            fill: '#FFFFFF',
		            stroke: '#000000',
		            strokeThickness: 3,
		            align: 'center'
		        });
		    StaticText1.anchor.setTo(0.5, 0.5);

			StaticText = Game.add.text( Game.world.width - 60 , Game.world.height - 40 , "Music on", {
		            font: '12px "Press Start 2P"',
		            fill: '#FFFFFF',
		            stroke: '#000000',
		            strokeThickness: 3,
		            align: 'center'
		        });
		    StaticText.anchor.setTo(0.5, 0.5);       
		    StaticText.inputEnabled = true;
		    StaticText.input.useHandCursor = true;

			CommentText = Game.add.text( 10 , Game.world.height - 40 , "Hello!", {
		            font: '12px "Press Start 2P"',
		            fill: '#FFFFFF',
		            stroke: '#000000',
		            strokeThickness: 3,
		            align: 'center'
		        });
		    CommentText.anchor.setTo(0,0.5);

		    var listener = function() {
			    if (SoundTrigger){
			    	StaticText.setText('Music off');
			    	SoundTrigger = false;
			    	music.stop();
			    } else {
			    	StaticText.setText('Music on');
			    	SoundTrigger = true;
			    	music.play();
			    }		    	
		    }

		    StaticText.events.onInputDown.add(listener,this);

		    // add STAR sprite for menu
		    star = Game.add.sprite((Game.world.width / 2) - 120, 90,'star');
		    Game.physics.enable(star, Phaser.Physics.ARCADE);
		    // *** assign key to select menu items 
		    upKey = Game.input.keyboard.addKey(Phaser.Keyboard.UP);
		    downKey = Game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
		    // *** assign key to confirm selected menu item
		    enterKey = Game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
		    // *** assign key to play|stop music
		    muteKey = Game.input.keyboard.addKey(Phaser.Keyboard.M);

		    Game.input.keyboard.addKeyCapture([ Phaser.Keyboard.UP, Phaser.Keyboard.DOWN ]);

		    Game.input.keyboard.onUpCallback = function( e ){            
		    	if(e.keyCode == Phaser.Keyboard.UP){                
		    		// console.log('upkey is UP y = ' + star.y);
		    		switch (stY) {
		    			case 0:
		    				stY = 4;
		    				star.y = starY[stY];
		    				break;
		    			case 1:
		    				star.y = starY[--stY];
		    				break;
		    			case 2:
		    				star.y = starY[--stY];
		    				break;
		    			case 3:
		    				star.y = starY[--stY];
		    				break;		    				
		    			case 4:
		    				star.y = starY[--stY];
		    				break;	
		    			default:
		    				break;	    				
		    		}
		    		menu_music.play();
		    		menu_music.volume = 0.9;	
		    		CommentText.setText('Select MenuItem: ' + stY);	
			    }        
		    	if(e.keyCode == Phaser.Keyboard.DOWN){                
		    		console.log('downkey is UP y = ' + star.y);                
		    		switch (stY) {
		    			case 0:
		    			    star.y = starY[++stY];
		    				break;
		    			case 1:
		    				star.y = starY[++stY];
		    				break;
		    			case 2:
		    				star.y = starY[++stY];
		    				break;
		    			case 3:
		    				star.y = starY[++stY];
		    				break;		    				
		    			case 4:
		    				stY = 0;
		    				star.y = starY[stY];		    			
		    				break;	
		    			default:	    			
		    				break;	    				
		    		}	    		
		    		menu_music.play();
		    		menu_music.volume = 0.9;
		    		CommentText.setText('Select MenuItem: ' + stY);
			    }	
			    if(e.keyCode == Phaser.Keyboard.M)	{
			    	if (SoundTrigger){
			    	   StaticText.setText('Music off');
			    	   SoundTrigger = false;
			    	   music.stop();
			    	} else {
			    	   StaticText.setText('Music on');
			    	   SoundTrigger = true;
			    	   music.play();
			    	}
			    }	   
			    if(e.keyCode == Phaser.Keyboard.ENTER) {
			    	CommentText.setText(' Key Enter press');
			    } 
		    };

		    Game.input.mouse.capture = true;
		    // логотип движка вклеим
		    phaser = Game.add.sprite( Game.world.width / 2, (Game.world.height / 2) + 40,'phaser');
		    phaser.anchor.setTo(0.5,0.5);

		}; //MainMenuState.create

		MainMenuState.update = function() {
			var onCollide = function() {
				dollar_music.play();
			}
			// логика по клавишам вверх и вниз в меню для спрайта звезды
			star.body.velocity.y = 0;
			star.body.acceleration.y = 0;
			if ( music.isPlaying ){	

			} else {
				if (SoundTrigger) music.play();
					//SoundTrigger = true;
			}
			Game.physics.arcade.collide(dollar, dollar2, onCollide);
		}; // MainMenuState.update~

		MainMenuState.render = function() {
    		// display debug info
		}; // MainMenuState.render~

	///////////////////////////////////////////////////////////////////////////
	//                  Создаем instance GameState                           //
	///////////////////////////////////////////////////////////////////////////
	var GameState = new Phaser.State();

		GameState.create = function() {

		}	

	///////////////////////////////////////////////////////////////////////////
	//                  Создаем instance GameOverState                       //
	///////////////////////////////////////////////////////////////////////////
	var GameOverState = new Phaser.State();

		GameOverState.create = function() {

		}		

	///////////////////////////////////////////////////////////////////////////
	//                  Добавляем все игровые State в объект Game            //
	///////////////////////////////////////////////////////////////////////////
	    Game.state.add('Boot', BootGameState, false);
	    Game.state.add('Preloader', PreloaderGameState, false);
	    Game.state.add('MainMenu', MainMenuState, false);
	    //Game.state.add('Game', GameState, false);
	    //Game.state.add('GameOver', GameOverState, false);

	    //Главным шагом является старт загрузки Boot State'а
	    Game.state.start('Boot');		
} // GameInitialize~