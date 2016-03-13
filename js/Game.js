WebFont.load({
        google: {
            families: ['Press+Start+2P', 'Play::latin,cyrillic-ext']
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
	    SCENE = 'game_box', //идентификатор сцены, где нужно рендерить. В данном случае пусто (по умолчанию рендерит в body)
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
	    Game.antialias = true;
	    Game.raf.start();
	///////////////////////////////////////////////////////////////////////////
	//                  Создаем instance BootGameState                       //
	///////////////////////////////////////////////////////////////////////////
	var BootGameState = new Phaser.State();
		BootGameState.preload = function() {
			Game.load.image('preloader','assets/joker.png');
		}; // BootGameState.preload~
	    BootGameState.create = function() {
		    var preloader = Game.add.image(Game.world.width / 2, Game.world.height / 2, 'preloader');
		    preloader.anchor.setTo(0.5,0.5);
		    // preloader.width = 800;
		    // preloader.height = 600;	    	
	        LoadingText = Game.add.text(Game.world.width / 2, (Game.world.height / 2) + 130, LOADING_TEXT, {
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
		

	};	// loadAssets~
	///////////////////////////////////////////////////////////////////////////
	//                  Создаем instance PreloaderGameState                  //
	///////////////////////////////////////////////////////////////////////////
	var PreloaderGameState = new Phaser.State();	
		PreloaderGameState.preload = function() {
		    // loadAssets();
		};	
		PreloaderGameState.create = function() {			
		    var tween = Game.add.tween(LoadingText).to({
		        alpha: 0
		    }, 3000, Phaser.Easing.Linear.None, true);

		    tween.onComplete.add(function() {
		        Game.state.start('MainMenu', true, true);
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

		// for bg sound;
		var StaticText,
			CommentText;
		var menu_music;
		var music;

		var SoundTrigger = true;
		// test var
		var i = 0;
		// text of menu & title
		var MenuItemText = new Array (
			"Тренировка", 
			"Игра", 
			"Создать игру", 
			"Настройки", 
			"Правила"
			), 
			TitleText = "$ ПОКЕР НА КУБИКАХ $",
			CommentMenuText = new Array (
			"Тренировка - начни играть не теряя фишки", 
			"Игра - играй с компьютером и выигрывай", 
			"Создать игру - создайте стол и начните игру с другом", 
			"Настройки - выберай аватар и другие настройки", 
			"Правила - перед игрой прочитай условия и правила"
			);
		MainMenuState.preload = function() {
			Game.load.bitmapFont('shortstack', 'assets/fonts/bitmapFonts/shortStack.png', 'assets/fonts/bitmapFonts/shortStack.xml');
			Game.load.bitmapFont('desyrel', 'assets/fonts/bitmapFonts/desyrel.png', 'assets/fonts/bitmapFonts/desyrel.xml');
			Game.load.bitmapFont('shortstack', 'assets/fonts/bitmapFonts/shortStack.png', 'assets/fonts/bitmapFonts/shortStack.xml');		

			Game.load.image('bg','assets/sky.png');
			Game.load.image('star', 'assets/star.png');
			Game.load.image('phaser', 'assets/phaser.png');

			Game.load.spritesheet('coins', 'assets/coin.png', 32, 32);
						
			Game.load.audio('menu_switch', 'assets/audio/menu_switch.mp3');	

			Game.load.audio('bg_audio', 'assets/audio/bodenstaendig_2000_in_rock_4bit.mp3');			
		}
		MainMenuState.create = function() {
			Game.physics.startSystem(Phaser.Physics.ARCADE);
			// *** build static scene ****
			var bg = Game.add.image(0,0,'bg');
		    	bg.width = 800;
		    	bg.height = 600;

			var bar = Game.add.graphics();
			    bar.beginFill(0x000000, 0.2);
			    bar.drawRect(0, 540, 800, 40);
			var coins = Game.add.group();
				for(var x=0; x < 12; x++){
					var coin = coins.create(Game.world.randomX, Game.world.randomY, 'coins', 0);
					Game.physics.arcade.enable( coin );
					coin.body.velocity.setTo(200,200);
					coin.body.collideWorldBounds = true;
					coin.body.bounce.set(1);
				}
				coins.setAll('inputEnabled', true);
			    //  Now using the power of callAll we can add the same animation to all coins in the group:
			    coins.callAll('animations.add', 'animations', 'spin', [0, 1, 2, 3, 4, 5], 10, true);

			    //  And play them
			    coins.callAll('animations.play', 'animations', 'spin');

			    music = Game.add.audio('bg_audio');
				music.volume = 0.2;
				menu_music = Game.add.audio('menu_switch');
				menu_music.volume = 0.5;

			// текст главного меню
			function addTextToScene( wX, wY, mText ) {
				var curText = "";
				curText = Game.add.text( wX, wY, mText, {
		            font: '20px Play',
		            fill: '#FFFFFF',
		            stroke: '#000000',
		            strokeThickness: 2,
		            align: 'center'
		        });
		    	curText.anchor.setTo(0.5, 0.5);
			}

			var y;
			var worldHalfWithX = (Game.world.width / 2);

			for (y = 0; y < 5; y++) {
				addTextToScene( worldHalfWithX, 105 + (40*y), MenuItemText[y]);
			};

			addTextToScene(worldHalfWithX, 50, TitleText);


			var	StaticText1 = Game.add.text( Game.world.width / 2, Game.world.height - 40, "Разработчик aka 'Zerom' 2016 (c)", {
		            font: '14px Play',
		            fill: '#FFFFFF',
		            stroke: '#000000',
		            strokeThickness: 2,
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

			CommentText = Game.add.text( worldHalfWithX , Game.world.height - 140 , "Добро пожаловать", {
		            font: '14px Play',
		            fill: '#FFFFFF',
		            stroke: '#000000',
		            strokeThickness: 3,
		            align: 'center'
		        });
		    CommentText.anchor.setTo(0.5,0.5);

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
		    		CommentText.setText(CommentMenuText[stY]);
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
		    		CommentText.setText(CommentMenuText[stY]);
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
			    	CommentText.setText(' Switch to: ' + stY);
			    	// todo: выбрать state и удалить мусор 
			    	music.stop();

			    	Game.state.start('TrainGame', true, true);
			    } 
		    };

		    Game.input.mouse.capture = true;
		    // логотип движка вклеим
		    phaser = Game.add.sprite( Game.world.width / 2, (Game.world.height / 2) + 40,'phaser');
		    phaser.anchor.setTo(0.5,0.5);

		}; //MainMenuState.create

		MainMenuState.update = function() {

			// логика по клавишам вверх и вниз в меню для спрайта звезды
			star.body.velocity.y = 0;
			star.body.acceleration.y = 0;
			if ( music.isPlaying ){	

			} else {
				if (SoundTrigger) music.play();
					//SoundTrigger = true;
			}

		}; // MainMenuState.update~

		MainMenuState.render = function() {
    		// display debug info
		}; // MainMenuState.render~

	///////////////////////////////////////////////////////////////////////////
	//             Создаем instance TrainGameState                           //
	///////////////////////////////////////////////////////////////////////////
	var TrainGameState = new Phaser.State();
		var dice = [
			[null, null, null, null, null],
			[null, null, null, null, null],
			[null, null, null, null, null],
			[null, null, null, null, null],
			[null, null, null, null, null]
		];
		var score_combine_text = new Array (
			"Тройка - 100 очков",
			"Фулхаус - 200 очков",
			"Карэ - 300 очков",
			"Стрит - 500 очков",
			"Покер - 1000 очков"
		);
		TrainGameState.preload = function() {
			Game.load.spritesheet('dice', 'assets/dice.png', 64, 64);
			Game.load.spritesheet('roll', 'assets/button-horizontal.png', 64, 32);
			Game.load.image('cells','assets/block.png');
		} // TrainGameState.preload~
		TrainGameState.create = function() {
		//  - добавим рабочий фон сцены
			var bg = Game.add.graphics();
			    bg.beginFill(0x507010, 0.5);
			    bg.drawRect(0, 0, 800, 600);
		//  - добавим кнопку возврата в меню (закрытие трейнгеймстейт)
			var	CloseTrainText = Game.add.text( Game.world.width - 35, 15 , "Закрыть", {
		            font: '12px Play',
		            fill: '#ECD042',
		            stroke: '#000000',
		            strokeThickness: 1,
		            align: 'center'
		        });
		    CloseTrainText.anchor.setTo(0.5,0.5);
		    CloseTrainText.inputEnabled = true;
		    CloseTrainText.input.useHandCursor = true;
		    CloseTrainText.events.onInputDown.add(function(){
		    	// ********
		    	Game.state.start('MainMenu',true,true);
		    },this);
		//  - добавим начальный тестовый текст и скроем его и удалим
			var	CommentText = Game.add.text( Game.world.width / 2 , Game.world.height / 2, "Тренировка", {
		            font: '22px Play',
		            fill: '#FFF',
		            stroke: '#CCC',
		            strokeThickness: 2,
		            align: 'center'
		        });
		    CommentText.anchor.setTo(0.5,0.5);
		    var tween2 = Game.add.tween(CommentText).to({
		        alpha: 0
		    }, 3000, Phaser.Easing.Linear.None, true);
		    tween2.onComplete.add(function() {
		        this.game.tweens.remove(tween2);
		        console.log('this game tween removed;');
		    }, this);
		// - добавим кнопку "Бросить"		    
		    var rollButtonOnClick = function(){
		    	console.log('roll press');
		    };
			var rollButton = Game.add.button(Game.world.centerX, Game.world.centerY + 175, 'roll', rollButtonOnClick, this, 0, 0, 1);
	    	rollButton.anchor.setTo(0.5, 0.5);
			var	RollText = Game.add.text( Game.world.centerX, Game.world.centerY + 175, "Бросить", {
		            font: '14px Play',
		            fill: '#FFF',
		            stroke: '#000',
		            strokeThickness: 1,
		            align: 'center'
		        });
		    RollText.anchor.setTo(0.5,0.5);	    	
		// - добавим ячейки сбора костей
			var diceCells = Game.add.group();
			for(var i=0; i<6; i++){
				var diceCell = diceCells.create(220 + (60*i),Game.world.centerY - 175,'cells',0);	
			};
			diceCells.setAll('scale.x', 0.5);
			diceCells.setAll('scale.y', 0.5);

		// - добавим панель с подсказками комбинаций
			var footer = Game.add.graphics();
			    footer.beginFill(0xe4e4e4, 0.5);
			    footer.drawRect(0, 530, 800, 70);
			function placeScoreHint(pX, pY, itemNum) { // функция разместитель подсказок
				hint_score_combine_text = Game.add.text( pX , pY, score_combine_text[itemNum], {
			            font: '12px Play',
			            fill: '#000',
			            stroke: '#ccc',
			            strokeThickness: 1,
			            align: 'center'
			        });
			    hint_score_combine_text.anchor.setTo(0.5);
			};			    
			var i = 0, j = 0; // размещаем кубики подсказки комбинаций
				for( i=0; i<6; i++ ) {
					j = 0;
					switch (i) {
						case 0: // сэт тройка
						dice[i][j++] = Game.add.sprite((20*j) + 40, 550, 'dice', 4);
						dice[i][j++] = Game.add.sprite((20*j) + 40, 550, 'dice', 4);
						dice[i][j++] = Game.add.sprite((20*j) + 40, 550, 'dice', 4);
						placeScoreHint((20*j) + 45, 545, i);
						dice[i][j++] = Game.add.sprite((20*j) + 40, 550, 'dice', 0);
						dice[i][j++] = Game.add.sprite((20*j) + 40, 550, 'dice', 1);

						dice[i].forEach(function(item, i, arr) {
							item.scale.x = 0.3;
							item.scale.y = 0.3;
						});
						dice[i][3].alpha = 0.3;
						dice[i][4].alpha = 0.3;
						break;
						case 1: // сэт фулл хаус
						dice[i][j++] = Game.add.sprite((20*j) + 160, 550, 'dice', 1);
						dice[i][j++] = Game.add.sprite((20*j) + 160, 550, 'dice', 1);
						dice[i][j++] = Game.add.sprite((20*j) + 160, 550, 'dice', 1);
						placeScoreHint((20*j) + 165, 545, i);
						dice[i][j++] = Game.add.sprite((20*j) + 160, 550, 'dice', 5);
						dice[i][j++] = Game.add.sprite((20*j) + 160, 550, 'dice', 5);

						dice[i].forEach(function(item, i, arr) {
							item.scale.x = 0.3;
							item.scale.y = 0.3;
						});
						break;
						case 2: // сэт карэ
						dice[i][j++] = Game.add.sprite((20*j) + 280, 550, 'dice', 4);
						dice[i][j++] = Game.add.sprite((20*j) + 280, 550, 'dice', 4);
						dice[i][j++] = Game.add.sprite((20*j) + 280, 550, 'dice', 4);
						placeScoreHint((20*j) + 285, 545, i);
						dice[i][j++] = Game.add.sprite((20*j) + 280, 550, 'dice', 4);
						dice[i][j++] = Game.add.sprite((20*j) + 280, 550, 'dice', 1);

						dice[i].forEach(function(item, i, arr) {
							item.scale.x = 0.3;
							item.scale.y = 0.3;
						});
						dice[i][4].alpha = 0.3;					
						break;
						case 3: // сэт стрит
						dice[i][j++] = Game.add.sprite((20*j) + 400, 550, 'dice', 0);
						dice[i][j++] = Game.add.sprite((20*j) + 400, 550, 'dice', 1);
						dice[i][j++] = Game.add.sprite((20*j) + 400, 550, 'dice', 2);
						placeScoreHint((20*j) + 405, 545, i);
						dice[i][j++] = Game.add.sprite((20*j) + 400, 550, 'dice', 3);
						dice[i][j++] = Game.add.sprite((20*j) + 400, 550, 'dice', 4);						
						dice[i].forEach(function(item, i, arr) {
							item.scale.x = 0.3;
							item.scale.y = 0.3;
						});						
						break;
						case 4: // сэт покер
						dice[i][j++] = Game.add.sprite((20*j) + 520, 550, 'dice', 0);
						dice[i][j++] = Game.add.sprite((20*j) + 520, 550, 'dice', 0);
						dice[i][j++] = Game.add.sprite((20*j) + 520, 550, 'dice', 0);
						placeScoreHint((20*j) + 525, 545, i);
						dice[i][j++] = Game.add.sprite((20*j) + 520, 550, 'dice', 0);
						dice[i][j++] = Game.add.sprite((20*j) + 520, 550, 'dice', 0);						
						dice[i].forEach(function(item, i, arr) {
							item.scale.x = 0.3;
							item.scale.y = 0.3;
						});						
						break;
						default:
						break;
					};
				};
		// - добавим панель с подсказками ходов. Подсказки при добавлении интерактива.
			var rightPanel = Game.add.graphics();
			    rightPanel.beginFill(0xA06D3D, 0.5);
			    rightPanel.drawRect(Game.world.width - 125, Game.world.centerY -175, 120, 350);			
		// - добавим панель с аватаром и результатами раундов
			var leftPanel = Game.add.graphics();
			    leftPanel.beginFill(0xAA6D3D, 0.5);
			    leftPanel.drawRect(5, Game.world.centerY -175, 120, 350);		
		// - добавим общий результат хода игры по броскам (ниже левой панели)
		// - добавим кол-во текущих бросков в раунде
		// - добавим кнопку вызова панельки с помощью (правилами)
		// - добавим скрытую панель с текстом правил
		// - добавим кнопку переключения звуков
		// - добавим баннера (ротируемые в перспективе)
		// todo: отделить статический каркас и вынести как константа всех сцен	
		// - добавить событие выброса костяшек	    
		} // TrainGameState.create~
		TrainGameState.update = function() {

		} // TrainGameState.update~

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
	    Game.state.add('TrainGame', TrainGameState, false);
	    Game.state.add('Game', GameState, false);
	    Game.state.add('GameOver', GameOverState, false);

	    //Главным шагом является старт загрузки Boot State'а
	    Game.state.start('Boot');		
} // GameInitialize~