var args = [ window , document , function(query){return [].slice.call(document.querySelectorAll.bind(document)(query))} ];

(function( window , document , $   /* */,    custom_alert , validate_email , get_ob , send_return , send_return_image , lazy_load_images , document_loaded , window_loaded , trigger_event , tap_listener  , key_listener , term , u_id , load_term , term_lock , _  ){
	
	
	term_lock = false;
	
	_ = function( word ){
		
		return "{["+word+"]}";
		
	};
	
	
	String.prototype.podziel = function( word ){
		
		return this.split( _(word) );
		
	};
	
	
	term = function( zmienna ){
		
		
			
			if( !term_lock ){ // jeśli nie jest zablokowany
				
				load_term( zmienna ); // to ładuje do niego tekst
				
			} else {
				
				setTimeout(function(){ // jeśli jest zablokowany to czeka
					
					term( zmienna );
					
				} , 100 );
				
			}
			
		
		
	};
	
	
	load_term = function( lineContents , prompt , $lines , terminal , float ){
		
		prompt = $('.prompt');
		
		float = $( ".float_etl" );
		
		if( prompt . length != 1 || float . length != 1 )
			return console.error("Błąd modułu terminalu.");
		
		prompt = prompt [ 0 ] ;
		
		float = float [ 0 ] ;

		//lineContents = new Array();
		
		$lines = lineContents . map(function( el , p ){
			
			p = document . createElement ('p');
			
			//p . innerHTML = el;
			
			prompt . appendChild ( p ) ;
			
			return p ;
			
		}) ;

		terminal = function( element , content , charIdx , typeChar , rand , char , typeLine ) {

			
			term_lock = true; // blokuję terminal
			
		
		  
		  typeLine = function( idx , skip ) {
			  
			  
			  skip = 0;
			  
			  
			idx == null && (idx = 0);
			if( idx >= $lines.length )
			  return ( term_lock = false );
			element = $lines[(idx)];
			content = lineContents[idx];
			
			if( content . indexOf( _( "skip" ) ) != -1 ){
				
				content = content . podziel( "skip" ) . join( '' ) ;
				
				skip = 1;
				
			}
			
			charIdx = 0;

			typeChar = function( type_char_callback ) {
			  //rand = Math.round(Math.random() * 0) + 0;

			  type_char_callback = function() {
				  
					char = content[charIdx++];
					if(typeof char !== "undefined"){
					  element.append( char == '\u000A' ? document.createElement('br') : char );
					  typeChar();
				  }
					else {
					  element.classList.remove('active');
					  typeLine(++idx);
					}
					
			  };
			  
			  if( skip ){
				  
				//type_char_callback();  
				
				element . innerHTML = content ;
				
				element.classList.remove('active');
				
				typeLine(++idx);
				  
			  } else {
			  
				setTimeout( type_char_callback , /*skip ? 0 : rand*/ 1 )/*()*/;
			  
			  }
			  
			  float . scrollTop = float . scrollHeight + float . offsetHeight * 2 ;
			  
			};
			
			element.classList.add('active');
			
			typeChar();
		  };

		  /*$lines.forEach(function(el , i) {
			lineContents[i] = el.innerHTML;
			el.innerHTML = '';
		  });*/

		  typeLine();
		}

		terminal();
		
	};
	

	
	
	
	
	trigger_event = function(nazwa,element){ // wywołuje event (kliknięcie)
		var event; // The custom event that will be created

		  if (document.createEvent) {
			event = document.createEvent("HTMLEvents");
			event.initEvent(nazwa, true, true);
		  } else {
			event = document.createEventObject();
			event.eventType = nazwa;
		  }

		  event.eventName = nazwa;

		  if (document.createEvent) {
			element.dispatchEvent(event);
		  } else {
			element.fireEvent("on" + event.eventType, event);
		  }
	};
	
	tap_listener = function( e , c ){
		
		c=e.target;
		
		
		if(c.classList.contains("clickable")){
			e.preventDefault();
			e.stopPropagation();
			if(e.originalEvent){
				e.originalEvent.preventDefault();
				e.originalEvent.stopPropagation();
			}
			
			
			
			if("href" in c.dataset){
				
				window.location.href = c.dataset.href;
				
			} else if( "action" in c.dataset ){
				
				(function( id ){
				
				id = "uid" in c . dataset ? c . dataset . uid : u_id() ;
				
				term( ["\u000A","Numer ID dla akcji: "+id,"Akcja: "+c.dataset.action.toUpperCase(),"\u000A","Łączenie..."] );
				
				main_callback = function( d ){
					
					try{
						
						d = JSON.parse(d);
						
					} catch (ex) {
						
						term( [ "Błąd przy parsowaniu odpowiedzi z serwera..." ] );
						
						return alert("Błąd serwera. Spróbuj ponownie. "+d);
						
					}
					
					console.log(d);
					
					if( "success" in d && d . success ){
						
						if( "product" in d ){
							
							(function( p ){
								
								p = d . product;
								
								term( ["\u000A","---","\u000A","Informacje o produkcie: "].concat( Object . keys( p ) . map(function( key ){
									
									if(key != 'opinie')
										return "\u00A0-->\u00A0"+key+": "+p[key];
									
									//else return "\u00A0-->\u00A0"+key+": ";
									else return "";
									
								}) ) /*. concat( p['opinie'] . map( function( el , arr ){
									
									arr = [  ];
									
									Object . keys ( el ) . forEach(function( cecha ){
										
										arr [ arr . length ] = "{[skip]}\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0-->\u00A0" + cecha + ": ";
										
										el [ cecha ] . forEach(function( element ){
											
											arr [ arr . length ] = "{[skip]}\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0-->\u00A0" + element ;
											
										});
										
									});
									
									return arr;
									
								} ) . reduce( function( prev , curr , index ){
									
									prev = prev . concat ( ["\u00A0\u00A0\u00A0\u00A0\u00A0"+(index+1)+': '] . concat ( curr ) );
									
									return prev;
									
								} , [] ) )*/  );
								
							})();
							
						} else if( "products" in d ){
							
							//console.log("PRODS",d,d.products);
							
							d . products . forEach(function( prod ){
								
								
								(function( p ){
								
								p = prod ;
								
								$('.prompt')[0] . innerHTML += "<p>" + ( ["\u000A","---","\u000A","Informacje o produkcie: "].concat( Object . keys( p ) . map(function( key ){
									
									if(key != 'opinie')
										return "\u00A0-->\u00A0"+key+": "+p[key];
									
									else return "\u00A0-->\u00A0"+key+": ";
									
								}) ) . concat( p['opinie'] . map( function( el , arr ){
									
									arr = [  ];
									
									Object . keys ( el ) . forEach(function( cecha ){
										
										arr [ arr . length ] = "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0-->\u00A0" + cecha + ": ";
										
										el [ cecha ] . forEach(function( element ){
											
											arr [ arr . length ] = "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0-->\u00A0" + element ;
											
										});
										
									});
									
									arr [ arr . length ] = "<div class='clickable opinia_text' data-action='text' data-value='{[id]}' >Eksportuj opinię do pliku tekstowego</div>" . podziel( "id" ) . join( el . id ) ;
									
									//return "<p>" + arr . join( "</p><p>" ) + "</p>" ;
									return arr ;
									
								} ) . reduce( function( prev , curr , index ){
									
									prev = prev . concat ( ["\u00A0\u00A0\u00A0\u00A0\u00A0"+(index+1)+': '] . concat ( curr ) );
									
									return prev;
									
								} , [] ) )  ) . join( "</p><p>" ) + "</p>";
								
							})();
							
							});
							
							if( !( d . products . length ) )
								term( [ "Brak rekordów w bazie danych.." ] );
							
						}

						if( "request_file" in d ){ // serwer nam mówi, że mamy czekać na plik
							
							term( ["\u000A","Pobieranie opinii w toku...","Szacowany czas w sekundach: {[]} ...".split("{[]}").join( Math . ceil ( d . request_file * .7 ) )  ] );
							
							send_return_get( "/"+id+".json?v="+(new Date()).getTime() , "" , main_callback );
							
						} else if( "extract" in d && d . extract ){
							
							(function( btns ){
								
								btns = $(".float_etl div.clickable.etl");
				
								if( btns . length != 4 )
									return alert( "Błąd składni HTML (ex3). Spróbuj odświeżyć stronę." );
								
								btns[2] . dataset . uid = id ;
								
								term( [ "Wykonano akcję Extract..." ] );
								
								trigger_event( "tap" , document.body );
								
							})();
							
						} else if( "transform" in d && d . transform ){
							
							(function( btns ){
								
								btns = $(".float_etl div.clickable.etl");
				
								if( btns . length != 4 )
									return alert( "Błąd składni HTML (ex3). Spróbuj odświeżyć stronę." );
								
								btns[3] . dataset . uid = id ;
								
								term( [ "Wykonano akcję Transform..." ] );
								
								trigger_event( "tap" , document.body );
								
							})();
							
						} else if( "load" in d ){
							
							(function( btns ){
								
								btns = $(".float_etl div.clickable.etl");
				
								if( btns . length != 4 )
									return alert( "Błąd składni HTML (ex3). Spróbuj odświeżyć stronę." );
								
								btns . forEach(function( el ){
									
									delete el . dataset . uid ;
									
								});
								
								term( [ "Wykonano akcję Load...","Zaktualizowano rekordy w bazie danych w ilości: "+d.load ] );
								
								trigger_event( "tap" , document.body );
								
							})();
							
						}
						
					if( "stats" in d ){
						
						term( ["\u000A","---","\u000A","Informacje statystyczne: "].concat( Object . keys( d . stats ) . map(function( key ){
									
									
										return "\u00A0-->\u00A0"+key+": "+(d.stats)[key];
									
									
									
								}) ) );
						
					}
					
					if( "clear" in d && d . clear ){
						
						term( [ "\u000A","---","\u000A","Wyczyszczono bazę danych..","\u000A","---","\u000A" ] );
						
					}
					
					if( "csv" in d ){
						
						window . open( d . csv , "_blank" );
						
					}
					
					if( "text" in d ){
						
						window . open( d . text , "_blank" ); // _blank ==> nowa karta
						
					}
						
					} else if( "error" in d ) {
						
						term( [ "Wystąpił błąd","\u00A0-->\u00A0"+d . error ] );
						
					} else {
						
						term( [ "Wystąpił błąd","\u00A0-->\u00A0"+JSON.stringify(d,null,'\t') ] );
						
					}
					
				};
				
				(function( id ){send_return("/","prod_id="+c.dataset.value+"&action="+c.dataset.action+"&id="+id,main_callback);})( id );
				
				})(  ); // send_return to funkcja, która generuje zapytanie do serwera i dostaje odpowiedź
				
			}
			
		} else {
			
			key_listener ( e );
			
		}
		
		
		
	};
	
	u_id = function(S4) {
				S4 = function() {
				   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
				};
				return "c"+(S4()+S4()+S4()+S4()+S4()+S4()+S4()+S4());
			};
	
	key_listener = function( e , c ){
		
		//c = e . target ;
		
		//if( c . classList . contains( "prod_id" ) ){
			
			(function ustaw_przyciski( value , btns ){
				
				btns = $(".float_etl div.clickable.etl");
				
				if( btns . length != 4 )
					return alert( "Błąd składni HTML (ex3). Spróbuj odświeżyć stronę." );
				
				btns . forEach(function( el ){
					
					el . classList . add( 'disabled' ); // wyszarzamy wszystkie przyciski
					
				});
				
				value = $(".prod_id"); // pobieramy wartość pola tekstowego
				
				if( value . length != 1 )
					return alert("Błąd składni HTML (ex2). Spróbuj odświeżyć stronę.");
				
				value = value [ 0 ] ;
				
				value = value . value;
				
				if( ! ( value . length ) ){
					
					return alert( "Wprowadź kod produktu." ); // jeśli jest pusty
					
				}
				
				if( parseInt(value) != value ){
					
					return alert( "Wprowadź poprawny kod produktu składający się z cyfr." ); // jeśli nie jest liczbą
					
				}
				
				btns . forEach(function( el ){
					
					if( !( ( el . dataset . action == 't' || el . dataset . action == 'l' ) && !( "uid" in el . dataset ) ) ){
					
						el . classList . remove( 'disabled' );
						
					}
					
					el . dataset . value = value;
					
				});
				
			})();
			
		//}
		
	};
	
	
	
	document_loaded = function( e_dom ){ // po załadowaniu dokumentu
		
		
		
		
		
		
		document.addEventListener("tap",tap_listener,false);

		document.addEventListener("keyup",key_listener,false);
		
		document.addEventListener("input",key_listener,false);
		
		
		
		window.addEventListener("load",window_loaded,false);
		
		
		
		custom_alert();
		
				
		
		
		
	};
	
	
	/*
	
		Funkcje komunikacji z serwerem ==>
		
		(w3schools)
	
	*/
	
	
	get_ob = function(){
		var xmlhttp;
		if (window.XMLHttpRequest)
		  {// code for IE7+, Firefox, Chrome, Opera, Safari
		  xmlhttp=new XMLHttpRequest();
		  }
		else
		  {// code for IE6, IE5
		  xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
		  }
		  return xmlhttp;
	 };
	send_return = function(toWho,what,whatWhenReady){
		var xmlhttp=get_ob();
				xmlhttp.onreadystatechange=function(){
					if (xmlhttp.readyState==4)
					{
						if(xmlhttp.status==200)
							whatWhenReady(xmlhttp.responseText);
						else
							return send_return(toWho,what,whatWhenReady);
					}
				}
			xmlhttp.open("POST",toWho,true);
				xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
				xmlhttp.send(what);
	};
	
	send_return_get = function(toWho,what,whatWhenReady){
		var xmlhttp=get_ob();
				xmlhttp.onreadystatechange=function(){
					if (xmlhttp.readyState==4)
					{
						if(xmlhttp.status==200)
							whatWhenReady(xmlhttp.responseText);
						else
							return setTimeout(function(){send_return_get(toWho,what,whatWhenReady);},1000);
					}
				}
			xmlhttp.open("GET",toWho,true);
				xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
				xmlhttp.send(what);
	};
	
	send_return_image = function(toWho,what,whatWhenReady){
		var xmlhttp=get_ob();
				xmlhttp.onreadystatechange=function(){
					if (xmlhttp.readyState==4 && xmlhttp.status==200)
					{
						whatWhenReady(xmlhttp.responseText);
					}
				}
				xmlhttp.upload.addEventListener("progress",function(e){
					console.log(e.loaded+" / "+e.total);
				},false);
			xmlhttp.open("POST",toWho,true);
				//xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
				xmlhttp.send(what);
	};
	
	window.send_return = send_return;
	window.send_return_image = send_return_image;
	
	
	
	
	
	
	
	custom_alert = function(){
		
		(function(window,alert,custom,$){
	
	window[custom]=function(co   /* */   ,nowy,coords,ov,test_style,test_div,n_c,c){
		
		if( $( ".alertf" ) . length )
			return;
		
		c=$('body');
	
		if(c.length!=1)
			return;
	
		c=c[0];
		
		test_style=document.createElement("style");
					test_style.innerHTML=".test_style{position:fixed;opacity:0;}";
					document.head.appendChild(test_style);
					test_div=document.createElement("div");
					document.body.appendChild(test_div);
					
					test_div.classList.add("test_style");
					
					n_c=test_div.getBoundingClientRect();  // new coords
					
					nowy=test_div;
					
					nowy.style.left="auto";
					nowy.style.right=20+"px";
					//nowy.style.top=n_c.top+"px";
					nowy.style.top=-140+"px";
					//nowy.style.width=n_c.width+"px";
					nowy.style.width="50%";
					//nowy.style.maxHeight=n_c.height+"px";
					nowy.style.maxHeight=120+"px";
					nowy.style.height="120px";
					
					c=test_div;
		
		//console.log(co);
		
		nowy=document.createElement("div");
				coords=c.getBoundingClientRect();
				nowy.style.left=coords.left+"px";
				nowy.style.top=coords.top+"px";
				nowy.style.width=coords.width+"px";
				nowy.style.height=coords.height+"px";
				nowy.style.position="fixed";
				nowy.style.webkitTransition="all .7s ease";
				nowy.style.mozTransition="all .7s ease";
				nowy.style.msTransition="all .7s ease";
				nowy.style.oTransition="all .7s ease";
				nowy.style.transition="all .7s ease";
				nowy.classList.add("light_f_conf");
				nowy.classList.add("alertf");
				nowy.innerHTML=co;
				
				test_div.parentNode.removeChild(test_div);
					test_style.parentNode.removeChild(test_style);
				
				
				
				document.body.appendChild(nowy);
				ov=document.createElement('div');
				//ov.classList.add("age_overlay");
				setTimeout(function(){
					ov.classList.remove('force_visible');
					nowy.style.opacity="0";
					ov.style.pointerEvents="none";
					nowy.style.pointerEvents="none";
					setTimeout(function(){
						//this.parentNode.removeChild(this);
						//ov.parentNode.removeChild(ov);
						nowy.parentNode.removeChild(nowy);
					},1500);
				},3000);
				//document.body.appendChild(ov);
				setTimeout(function(){
					//ov.classList.add('force_visible');
					test_style=document.createElement("style");
					test_style.innerHTML=".test_style{position:fixed;left:50%;top:50%;-webkit-transform:translateX(-50%) translateY(-50%);-moz-transform:translateX(-50%) translateY(-50%);-o-transform:translateX(-50%) translateY(-50%);-ms-transform:translateX(-50%) translateY(-50%);transform:translateX(-50%) translateY(-50%);width:87%;max-width:1000px;height:50%;opacity:0;}";
					document.head.appendChild(test_style);
					test_div=document.createElement("div");
					document.body.appendChild(test_div);
					
					test_div.classList.add("test_style");
					
					n_c=test_div.getBoundingClientRect();  // new coords
					
					test_div.parentNode.removeChild(test_div);
					test_style.parentNode.removeChild(test_style);
					
					//nowy.style.left=n_c.left+"px";
					nowy.style.left="auto";
					nowy.style.right=20+"px";
					//nowy.style.top=n_c.top+"px";
					nowy.style.top=120+"px";
					//nowy.style.width=n_c.width+"px";
					nowy.style.width="50%";
					//nowy.style.maxHeight=n_c.height+"px";
					nowy.style.maxHeight=120+"px";
					nowy.style.height="auto";
				},100);
	
			return nowy;
	
	};
	
	window[alert]=function(a){return window[custom](a);};
	
	//window[alert]=function(a){return term([a]);};
	
})(window,'alert','display_freedom_alert',document.querySelectorAll.bind(document));
		
	};
	
	
	
	document.addEventListener("DOMContentLoaded",document_loaded,false);
	
}).apply(this,args);