module.exports = function( req , res , db , json , url , request , fs , local , jsdom , zasil_baze_prod , _ , id , validate , convert , run_queries , pobierz_opinie_z_bazy , clear_database , file_stream , generate_csv , generuj_text ){
	
	request = require('request'); // request ==> moduł odpytujący jakąś stronę i zwracający jej HTMLa
	
	fs = require('fs'); // 
	
	local = function(e){return require(__dirname+"/"+e)};
	
	_ = function( word ){
		
		return "{["+word+"]}";
		
	};
	
	
	String.prototype.podziel = function( word ){
		
		return this.split( _(word) );
		
	};
	
	String.prototype.fill_with_object_data = function( obj , t ){
		
		/*
		
			funkcja, która dzieli plik na {[słowo]} i wsadza odpowiednie wartości z obiektu obj
			
			obj ={
				
				"słowo1" : 123,
				"słowo2" : 456
				
			}
			
			plik = " asdsad {[słowo1]} sada {[słowo2]} "
			
			
			==>
			
			plik = " asdsad 123 sada 456 "
			
			zastępujemy klucz wartością dla każdego klucza
		
		*/
		
		t = this ;
		
		Object . keys ( obj ) . forEach(function( key , el ){
			
			el = obj [ key ] ;
			
			t = t
				.podziel( key )
					.join( db.escape( el ) );
			
		});
		
		return t;
		
	};
	
	json = JSON.stringify.bind(JSON); // funkcja, która serializuje JSONa z obiektu
	
	/*
	
		serializacja ==> zamieniam obiekt na tekst
		
		parsowanie ==> zamieniam tekst na zmienną w pamięci
		
		ZOBACZ ===> https://pl.wikipedia.org/wiki/JSON
	
	*/
	
	jsdom = require("jsdom"); //
	
	
	/*
	
		ZABEZPIECZENIA : ==>
	
	*/
	
	
	if( ! ( "body" in req ) )
		return res.end(json({ error:"Problem z autentykacją." }));
	
	
	/*
	
		obiekt request powinien zawierać klucz body, który zawiera parametry od przeglądarki (akcje: W , CLEAR, itd.)
		
		return ==> wychodzimy z funkcji ( w wypadku main scope wychodzimy z całego programu )
		
	*/
	
	req = req.body;
	
	if( ! ( "prod_id" in req && "action" in req && "id" in req && req . prod_id == parseInt(req.prod_id) && ( req . action == 'e' || req . action == 't' || req . action == 'l' || req . action == 'etl' || req . action == 'w' || req . action == 'clear' || req . action == 'csv' || req . action == 'text' ) ) )
		return res.end(json({ error:"Problem z zapytaniem." }));
	
	/*
	
		parseInt ==> zamień string'a na int'a
		
		czyli jeśli zmienna jest równa parseInt'owi z siebie to jest liczbą
	
	*/
	
	id = req . id ;
				
				validate = function( string ){
					
					return (new RegExp(/^[a-z0-9]+$/i)).test( string ); // walidujemy czy id akcji składa się tylko z liczb i liter
					
					/*
					
						RegExp ==> na stronie mozilli (zakładki) lub w3schools
					
					*/
					
				};
				
				if( !validate( id ) ){
					
					return res.end(JSON.stringify({ error:"Błąd zapytania (2). Spróbuj ponownie." }));
					
				}
	
	url = "http://www.ceneo.pl/prod_id"
		
		.split( "prod_id" )
			.join( req . prod_id )
		
	;
	
	convert = function(){
		
		jsdom . env ( // "uruchamia przeglądarkę" po stronie serwera
	
	   url ,
	  function ( err , window , $ , document , product , type , title , model , wygenerowano_opinie , zapisz_plik , przygotuj_plik , sciezka_do_pliku , odpytaj_opinie , queries , save_queries ) {
		
		
		/*
		
			OBSŁUGA błędów ==>
		
		*/
		
		
		if( err ){
			
			return res.end(JSON.stringify({ error:"Błąd serwera. Spróbuj ponownie. (1)" }));
			
		}
		
		if( !( "document" in window ) ){
			
			return res.end(JSON.stringify({ error:"Błąd serwera. Spróbuj ponownie. (2)" }));
			
		}
		
		document = window . document ;
		
		$ = function(query){return [].slice.call(document.querySelectorAll.bind(document)(query))}; // odwołanie do dokumentów na stronie i sparsowanie ich na tablicę
		
		if( $( ".error-page" ) . length ){
			
			return res.end(JSON.stringify({ error:"Produkt o podanym id prawdopodobnie nie istnieje." }));
			
		}
		
		type =  $("meta[property='og:type']") ;
		
		if( type . length != 1 )
			return res.end(JSON.stringify({ error:"Podana strona prawdopodobnie nie jest stroną produktu. (1)" }));
		
		type = type [ 0 ] ;
		
		if ( ! ( type . content == "product" ) ){
			
			return res.end(JSON.stringify({ error:"Podana strona prawdopodobnie nie jest stroną produktu. (2)" }));
			
		}
		
		// ustal model
			
			title = $("meta[property='og:title']");
			
			if( title . length != 1 ){
				
				return res.end(JSON.stringify({ error:"Niespodziewana odpowiedź z serwera Ceneo.pl (nie można pobrać modelu)" }));
				
			}
			
			title = title [ 0 ] . content ;
			
			model = title . split( " - " )[0];
			
			if( ! ( model . length ) ){
				
				return res.end(JSON.stringify({ error:"Niespodziewana odpowiedź z serwera Ceneo.pl (nie można pobrać modelu) (2)" }));
				
			}
			
			
			
		
		// round UP --> Math.ceil
		
		// "span[itemprop='reviewCount']"
		
		// "meta[property*='og:']"
		
		product = {};
		
		product . marka = $("meta[property='og:brand']");
		
		if( product . marka . length != 1 )
			return res.end(JSON.stringify({ error:"Nie udało się pobrać nazwy producenta." }));
		
		product . marka = product . marka [ 0 ] . content ;
		
		model = model.split( new RegExp( product . marka , 'i' ) ).join('').trim();
		
		// nazwa modelu powstaje poprzez odcięcie nazwy marki od tytułu strony
		
		product . model = model ;
		
		
		// ustal rodzaj
		
		
		(function( crumbs ){
			
			crumbs = $(".breadcrumb span");
			
			crumbs . shift(); // usuwam pierwszy element ( napis Ceneo )
			
			// Array.prototype.shift (Mozilla) ==> usuwa pierwszy element tablicy i zwraca tę tablicę
			
			crumbs = crumbs . map(function( el ){
				
				/*
				
					array.prototype.map (mozilla)
					
					przekształca KAŻDY element tablicy
				
				*/
				
				return el . innerHTML; // zwracamy to co chcemy zamiast danego elementu tablicy
				
			}) . join( " >> " );
			
			product . rodzaj = crumbs ;
			
		})();
		
		
		// ustal uwagi
		
		
		(function( uwagi ){
			
			uwagi = $('.ProductSublineTags');
			
			if( uwagi . length != 1 )
				return res.end(JSON.stringify({ error:"Niespodziewana odpowiedź z serwera Ceneo.pl (nie udało się pobrać uwag dotyczących produktu)" }));
			
			uwagi = uwagi [ 0 ] ;
			
			uwagi = uwagi . innerHTML;
			
			product . uwagi = uwagi;
			
		})();
		
		queries = []; // przechowujemy zapytania do bazy, które później chcemy wykonać
		
		
		zasil_baze_prod = function(){
			
			
			
			queries [ queries . length ] = "INSERT INTO `etl_prod`(`id`,`marka`,`model`,`rodzaj`,`uwagi`) VALUES({[id]},{[marka]},{[model]},{[rodzaj]},{[uwagi]})" . podziel("id") .join( db.escape( req . prod_id ) ) . fill_with_object_data( product ) ;
			
			// array [ array . length ] ==> wsadzenie elementu do tablicy na jej końcu
			
		};
		
		zasil_baze_prod();
		
		
		// pobierz opinie
		
		
		(function( opinie , ilosc_stron ){
			
			ilosc_stron = $("span[itemprop='reviewCount']");
			
			if( ilosc_stron . length != 1 )
				return res.end(JSON.stringify({ error:"Niespodziewana odpowiedź z serwera Ceneo.pl (nie udało się ustalić liczby opinii)" }));
			
			ilosc_stron = ilosc_stron [ 0 ] ;
			
			ilosc_stron = ilosc_stron . innerHTML;
			
			ilosc_stron = parseInt( ilosc_stron ) ;
			
			ilosc_stron = Math . ceil ( ilosc_stron / 10 );
			
			if( ilosc_stron < 1 ){
				
				return res.end(JSON.stringify({ error:"Błąd serwera (4)" }));
				
			}
			
			opinie = {1:$(".product-review")};
			
			/*
			
				opinie ={
					
					
					numer_strony: opinie
					
					
				}
			
			*/
			
			
			
			sciezka_do_pliku = "undefined.json";
			
			przygotuj_plik = function( id , validate ){
				
				id = req . id ;
				
				validate = function( string ){
					
					return (new RegExp(/^[a-z0-9]+$/i)).test( string );
					
				};
				
				if( !validate( id ) ){
					
					return res.end(JSON.stringify({ error:"Błąd zapytania (2). Spróbuj ponownie." }));
					
				}
				
				res.end(JSON.stringify({ success:true , request_file : ilosc_stron })); // na podstawie ilości stron obliczany jest orientacyjny czas oczekiwania
				
				sciezka_do_pliku = id+".json";
				
			};
			
			if( !( req . action == 't' ) ){
			
				przygotuj_plik();
			
			}
			
			zapisz_plik = function(){
				
				product . opinie = Object . keys ( opinie ) . reduce( function( prev , curr , index ){  //  temp
				
				/*
				
					Array.prototype.reduce (Mozilla)
				
				*/
					
					curr = opinie [ curr ] ; 
					
					curr = curr . map(function( el , obj , zalety , wady , gwiazdki , autor , data , przydatne , nieprzydatne , polecam , body ){
				
						zalety = [].slice.call ( el . querySelectorAll(".pros-cell ul li") );
						
						zalety = zalety . map(function( el2 ){
							
							return el2 . innerHTML . trim() ;
							
						});
						
						wady = [].slice.call ( el . querySelectorAll(".cons-cell ul li") );
						
						wady = wady . map(function( el2 ){
							
							return el2 . innerHTML . trim() ;
							
						});
						
						gwiazdki = [].slice.call ( el . querySelectorAll(".review-score-count") );
						
						gwiazdki = gwiazdki . map(function( el2 ){ 
						
							return parseFloat(el2 . innerHTML.replace(/,/g,'.'));
							
						});
						
						autor = [].slice.call ( el . querySelectorAll(".product-reviewer") );

						autor = autor . map( function( el2 ){ 
							
							return el2 . innerHTML . trim() ; 
							
						} );
						
						data = [].slice.call ( el . querySelectorAll("div > .review-time time") ) ;

						data = data . map( function( el2 ){

							return el2 . getAttribute ( 'datetime' ) ;

						} );
						
						przydatne = [].slice.call ( el . querySelectorAll(".vote-yes span") ) ;

						przydatne = przydatne . map( function( el2 ){

							return parseInt ( el2 . innerHTML ) ;

						} );
						
						nieprzydatne = [].slice.call ( el . querySelectorAll(".vote-no span") ) ;

						nieprzydatne = nieprzydatne . map( function( el2 ){

							return parseInt ( el2 . innerHTML ) ;

						} );
						
						polecam = [].slice.call ( el . querySelectorAll(".product-recommended,.product-not-recommended") ) ;

						polecam = polecam . map( function( el2 ){

							return  el2 . innerHTML . toUpperCase() ;

						} );
						
						body = [].slice.call ( el . querySelectorAll(".content-wide-col > .product-review-body") ) ;

						body = body . map( function( el2 ){

							return  el2 . innerHTML  ;

						} );
						
						review_id = [].slice.call ( el . querySelectorAll(".vote-yes.js_product-review-vote.js_vote-yes") ) ;

						review_id = review_id . map( function( el2 ){

							//return  el2 . dataset . reviewId  ;
							
							return  el2 . getAttribute ( 'data-review-id' ) ;

						} );
						
						obj = {
							
							zalety : zalety ,
							
							wady : wady ,
							
							"liczba gwiazdek" : gwiazdki ,
							
							autor : autor ,
							
							"data wystawienia" : data ,
							
							"uznali za przydatną" : przydatne ,
							
							"uznali za nieprzydatną" : nieprzydatne ,
							
							"rekomendacja" : polecam ,
							
							"podsumowanie" : body ,
							
							id : review_id ,
							
						};
						
						return obj;
						
					});
					
					prev = prev . concat ( curr );
					
					return prev;
					
				} , [] ) ;
				
				
				
				save_queries = function( new_queries ){
					
					new_queries = [];
					
					while( queries . length ){
						
						new_queries [ new_queries . length ] = ( queries . splice( 0 , 1 ) . join( "; " ) ) ; // grupuję zapytania po 1
						
					}
					
					//console.log ( new_queries ) ;
					
					if( req . action . split( '' ) . indexOf( 'l' ) != -1 ){ // jeśli wykonujemy funkcję Load
						
						run_queries ( new_queries );
						
					} else {
						
						fs.writeFile( "/app/static/etl/" + id + '.queries' , (JSON.stringify({ queries : new_queries })) , function( err ){
			
							if(err)
								return res.end(json({ error:"Błąd zapisywania pliku z zapytaniami do bazy danych.." }));
							
							return res.end(JSON.stringify({ success:true , transform : true , product : product })) ;
							
						} );
						
					}
					
				};
				
				(function generuj_zapis_opinii( template , query ){
					
					template = "INSERT INTO `etl_opinie`(`id`,`gwiazdki`,`autor`,`data`,`przydatne`,`nieprzydatne`,`rekomendacja`,`podsumowanie`,`prod_id`) VALUES({[id]},{[gwiazdki]},{[autor]},{[data]},{[przydatne]},{[nieprzydatne]},{[rekomendacja]},{[podsumowanie]},{[prod_id]})";
					
					query = '';
					
					product . opinie . forEach(function( opinia , temp ){
						
						temp = template;
						
						temp = temp
						
							.podziel( "gwiazdki" )
								.join( db.escape ( opinia[ "liczba gwiazdek" ] ) )
								
							.podziel( "data" )
								.join( db.escape ( opinia[ "data wystawienia" ] ) )
								
							.podziel( "przydatne" )
								.join( db.escape ( opinia[ "uznali za przydatną" ] ) )
								
							.podziel( "nieprzydatne" )
								.join( db.escape ( opinia[ "uznali za nieprzydatną" ] ) )
								
							.podziel( "prod_id" )
								.join( db.escape( req . prod_id ) )
								
							.fill_with_object_data( opinia );
							
						//query += temp + "; ";
						
						queries [ queries . length ] = temp ;
						
						( function zalety_i_wady( temp1 , temp2 ){
							
							temp1 = "INSERT INTO `etl_zalety`(`opinia_id`,`tresc`) VALUES({[id]},{[tresc]})" ;
							
							temp2 = "INSERT INTO `etl_wady`(`opinia_id`,`tresc`) VALUES({[id]},{[tresc]})" ;
							
							opinia . zalety . forEach( function(zaleta , temp3){
								
								temp3 = temp1;
								
								temp3 = temp3
								
									.podziel( "tresc" )
										.join( db.escape ( zaleta ) )

									.fill_with_object_data( opinia );
									
									;
								
								queries [ queries . length ] = temp3 ;
								
							} );
							
							opinia . wady . forEach( function(zaleta , temp3){
								
								temp3 = temp2;
								
								temp3 = temp3
								
									.podziel( "tresc" )
										.join( db.escape ( zaleta ) )

									.fill_with_object_data( opinia );
									
									;
								
								queries [ queries . length ] = temp3 ;
								
							} );
							
						} )();
						
					});
					
					//console.log(query);
					
					return save_queries();
					
				})();
				
				
				
				fs.writeFile( "/app/static/etl/{[id]}".split("{[id]}").join(sciezka_do_pliku) , (JSON.stringify({ success:true , product , stats : { "pobrane pliki" : Math . ceil ( product . opinie . length / 10 ) + 1 , "rekordy załadowane do bazy danych" : product . opinie . length + (function zlicz_zalety_i_wady( o , count ){
					
					o = product . opinie ;
					
					count = 0;
					
					o . forEach(function( one ){
						
						count += one . zalety . length + one . wady . length ;
						
					});
					
					return count;
					
				})() + 1 } })) , function( err ){
			
					if(err)
						return console.error("Błąd przy zapisywaniu pliku {[id]} ETL..".split("{[id]}").join(sciezka_do_pliku),err);
					
					jsdom = null ;
					
				} );
				
			};
			
			if( ilosc_stron > 1 ){
				
				odpytaj_opinie = function( i ){
					
					
					
					(function( i ){jsdom . env (
	
					  url+"/opinie-"+i,
					  function ( err2 , window2 , $_2 ){
						  
						  if( err2 ){
			
								return console.error("Nie udało się pobrać opinii ze strony nr "+i);
								
							}
							
							if( !( "document" in window2 ) ){
								
								return console.error("Nieprawidłowe dane na stronie opinii nr "+i);
								
							}
							
							
						  
						  $_2 = function(query){return [].slice.call(window2.document.querySelectorAll.bind(window2.document)(query))};
						  
						  opinie [ i ] = $_2(".product-review");
						  
						  window2.close();
						  
						  if( Object . keys ( opinie ) . length == ilosc_stron ){ // jeśli załadowaliśmy już wszystkie
							  
							  //wygenerowano_opinie();
							  
							  zapisz_plik(); // to kończymy
							  
						  } else { // jeśli jeszcze nie wszystkie
							  
							  odpytaj_opinie( ++i ); // to odpytaj następną (rekurencja) !
							  
						  }
						  
					  }
					  
					);})( i );
					
				};
				
				odpytaj_opinie(2);
				
			} else {
				
				//wygenerowano_opinie();
				
				zapisz_plik();
				
			}
			
			
			
		})();
		
	  }
	  
	);
		
	};
	
	run_queries = function( queries , callback ){
					
		
		callback = function( query ){ // ładuje jedno zapytanie do bazy danych
			
			db . query( query , function( err , rows ){
				
				if(err){
					
					/*return*/ console.error("ETL --> Nie udało się wprowadzić informacji do bazy danych. Produkt bądź opinia o tym ID widocznie już istnieje w bazie danych.",err);
					
				}
				
				if( queries . length ){ // jeśli jest kolejne do załadowania 
					
					callback( queries . shift() ); // to wywołuje ładowanie tego kolejnego
					
				}
				
			} );
			
		};
		
		
		if( queries . length ){
			
			callback( queries . shift() );
			
		}
		
					
	};
	
	pobierz_opinie_z_bazy = function( callback ){
		
		db . query( " SELECT * FROM `etl_prod` ; SELECT * FROM `etl_opinie` ; SELECT * FROM `etl_zalety` ; SELECT * FROM `etl_wady` " , function( err , rows , prods , opinie , zalety , wady ){
			
			if( err ){
				
				return callback( err );
				
			}
			
			prods = rows [ 0 ] ;
			
			opinie = rows [ 1 ] ;
			
			zalety = rows [ 2 ] ;
			
			wady = rows [ 3 ] ;
			
			prods . forEach( function( prod ){
				
				prod . opinie = opinie . filter(function( opinia ){
					
					return opinia . prod_id == prod . id ;
					
				}) . map( function( opinia , opinia_id ){
					
					opinia_id =  opinia . id ;
					
					//delete opinia . id ;
					
					delete opinia . prod_id ;
					
					Object . keys( opinia ) . forEach(function( key , el ){
						
						el = opinia [ key ] ;
						
						delete opinia [ key ] ;
								
						if( key == 'gwiazdki' )
							key = "liczba gwiazdek";
						else if( key == "data" )
							key = "data wystawienia";
						else if( key == "przydatne" )
							key = 'uznali za przydatną';
						else if( key == "nieprzydatne" )
							key = "uznali za nieprzydatną" ;
						
						opinia [ key ] = [ el ] ;
						
					}) ;
					
					opinia . zalety = zalety . filter(function( zaleta ){
						
						return zaleta . opinia_id == opinia_id ;
						
					}) . map(function( zaleta ){
						
						return zaleta . tresc ;
						
					}) ;
					
					opinia . wady = wady . filter(function( zaleta ){
						
						return zaleta . opinia_id == opinia_id ;
						
					}) . map(function( zaleta ){
						
						return zaleta . tresc ;
						
					}) ;
					
					return opinia ;
					
				} );
				
				//delete prod . id ;
				
			} );
			
			return callback( null , prods );
			
		} );
		
	};
	
	clear_database = function(  ){
		
		db . query( " DELETE FROM `etl_prod` ; DELETE FROM `etl_opinie` ; DELETE FROM `etl_zalety` ; DELETE FROM `etl_wady` " , function( err , rows ){
			
			if( err ){
				
				return console.error( "Nie udało się wyczyścić bazy danych etl",err ),res.end(json({ error:"Błąd przy czyszczeniu bazy danych.." }));
				
			}
			
			return res . end ( json( { clear : true , success : true } ) );
			
		} );
		
	};
	
	generate_csv = function( callback , csv , json2csv ){
		
		csv = require('csv');
		
		json2csv = require('json2csv');
		
		db . query( " SELECT * FROM `etl_prod` ; SELECT * FROM `etl_opinie` ; SELECT * FROM `etl_zalety` ; SELECT * FROM `etl_wady` " , function( err , rows , prods , opinie , zalety , wady ){
			
			if( err ){
				
				return callback( err );
				
			}
			
			prods = rows [ 0 ] ;
			
			opinie = rows [ 1 ] ;
			
			zalety = rows [ 2 ] ;
			
			wady = rows [ 3 ] ;
			
			prods . forEach( function( prod ){
				
				prod . opinie = opinie . filter(function( opinia ){
					
					return opinia . prod_id == prod . id ;
					
				}) . map( function( opinia , opinia_id ){
					
					opinia_id =  opinia . id ;
					
					delete opinia . id ;
					
					delete opinia . prod_id ;
					
					Object . keys( opinia ) . forEach(function( key , el ){
						
						el = opinia [ key ] ;
						
						delete opinia [ key ] ;
								
						if( key == 'gwiazdki' )
							key = "liczba gwiazdek";
						else if( key == "data" )
							key = "data wystawienia";
						else if( key == "przydatne" )
							key = 'uznali za przydatną';
						else if( key == "nieprzydatne" )
							key = "uznali za nieprzydatną" ;
						
						opinia [ key ] = [ el ] ;
						
					}) ;
					
					opinia . zalety = zalety . filter(function( zaleta ){
						
						return zaleta . opinia_id == opinia_id ;
						
					}) . map(function( zaleta ){
						
						return zaleta . tresc ;
						
					}) ;
					
					opinia . wady = wady . filter(function( zaleta ){
						
						return zaleta . opinia_id == opinia_id ;
						
					}) . map(function( zaleta ){
						
						return zaleta . tresc ;
						
					}) ;
					
					return opinia ;
					
				} );
				
				delete prod . id ;
				
			} );
			
			prods = prods . reduce(function( prev , curr , index ){
				
				curr . opinie . forEach(function( opinia ){
					
					Object . keys ( opinia ) . forEach(function( key ){
						
						if( key == 'zalety' || key == 'wady' )
							return delete opinia[key];
						
						opinia [ key ] = opinia [ key ] [ 0 ] ;
						
					});
					
					prev [ prev . length ] = opinia;
					
				}); 
				
				return prev;
				
			} , [] );
			
			
			
			json2csv( { data: prods } ,function( err , data , filename ){ // moduł generujący csv
				
				if( err ){
					
					return console.log("ETL JSON2CSV err: ",err),callback( err );
					
				}
				
				filename = id + '.csv';
				
				fs.writeFile( "/app/static/etl/" + filename , data , function( err ){
			
							if(err)
								return callback( err );
							
							return callback( null , "/" + filename );
							
						} );
				
			} );
			
			
			
		} );
		
	};
	
	generuj_text = function( callback , id , filename ){
		
		id = req . prod_id;
		
		filename = id + '.txt';
		
		id = db . escape( id );
		
		db . query( " SELECT * FROM `etl_opinie` WHERE `id` = {[id]} ; SELECT * FROM `etl_zalety` WHERE `opinia_id` = {[id]} ; SELECT * FROM `etl_wady` WHERE `opinia_id` = {[id]} " . podziel( "id" ) . join( id ) , function( err , rows , opinia , zalety , wady , text ){
			
			if( err ){
				
				return callback( err );
				
			}
			
			opinia = rows[0];
			
			if( !( opinia . length == 1 ) ){
				
				return callback( true );
				
			}
			
			zalety = rows[1] ;
			
			wady = rows[2] ;
				
			opinia = opinia. map( function( opinia , opinia_id ){
					
					opinia_id =  opinia . id ;
					
					//delete opinia . id ;
					
					delete opinia . prod_id ;
					
					Object . keys( opinia ) . forEach(function( key , el ){
						
						el = opinia [ key ] ;
						
						delete opinia [ key ] ;
								
						if( key == 'gwiazdki' )
							key = "liczba gwiazdek";
						else if( key == "data" )
							key = "data wystawienia";
						else if( key == "przydatne" )
							key = 'uznali za przydatną';
						else if( key == "nieprzydatne" )
							key = "uznali za nieprzydatną" ;
						
						opinia [ key ] = [ el ] ;
						
					}) ;
					
					opinia . zalety = zalety . filter(function( zaleta ){
						
						return zaleta . opinia_id == opinia_id ;
						
					}) . map(function( zaleta ){
						
						return zaleta . tresc ;
						
					}) ;
					
					opinia . wady = wady . filter(function( zaleta ){
						
						return zaleta . opinia_id == opinia_id ;
						
					}) . map(function( zaleta ){
						
						return zaleta . tresc ;
						
					}) ;
					
					return opinia ;
					
				} ) [ 0 ] ;
			
			
			
			text = (function generate_arr( arr , el ){
				
				arr = [  ];
				
				el = opinia ;
									
				Object . keys ( el ) . forEach(function( cecha ){
					
					arr [ arr . length ] = "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0-->\u00A0" + cecha + ": ";
					
					el [ cecha ] . forEach(function( element ){
						
						arr [ arr . length ] = "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0-->\u00A0" + element ;
						
					});
					
				});
				
				return arr ;
				
			})() . join( "\u000A" ) ;
			
			// "\u000A" - newline
			
			
				
				fs.writeFile( "/app/static/etl/" + filename , text , function( err ){
			
							if(err)
								return callback( err );
							
							return callback( null , "/" + filename );
							
						} );
			
		});
		
	};
	
	/*
	
		Determinujemy jaka jest akcja ==>
	
	*/
	
	if( req . action == 'e' ){
		
		return ( request( url ) // odpytujemy Ceneo.pl
		
		/*
			
			model Promise
		
		*/
			
			.on('response', function(response) { // kiedy dostaniemy odpowiedź
				
				return res.end(JSON.stringify({ success:true , extract : true })) ; // przekazujemy, że akcja Extract się wykonała
				
			  })
			
			.pipe(fs.createWriteStream( "/app/static/etl/" + id + '.extract' )) // plik HTML jest zapisywany do pliku, z którego potem korzysta funkcja T
			
			/*
			
				file_get_contents ==> UI blocking
				
				.pipe ==> non-blocking
			
			*/
		
		);
		
	} else if( req . action == 't' ){
		
		fs.readFile( "/app/static/etl/" + id + '.extract' , 'utf8', function( err , data ){
			
			if( err )
				return res.end(json({ error:"Nie udało się odczytać pliku dla wcześniej wykonanej akcji E. Spróbuj ponownie." }));
			
			file_stream = data;
			
			convert();
			
		});
		
	} else if( req . action == 'l' ){
		
		fs.readFile( "/app/static/etl/" + id + '.queries' , 'utf8', function( err , data ){
			
			if( err )
				return res.end(json({ error:"Nie udało się odczytać pliku dla wcześniej wykonanej akcji T. Spróbuj ponownie wykonać cały proces." }));
			
			try{
				
				data = JSON . parse (data); // parsowanie JSONa
				
				/*
				
					dlaczego dane są w JSON?
					
					po funkcji Transform z pliku HTML z Ceneo pobierane są marka, model, itd.. i zapisywane do zmiennych.
					
					Później zmienne serializowane są do JSONa
					
					JSON.parse ==> nie obsługuje błędów ==> dlatego mamy try catch
				
				*/
				
			} catch( ex ){
				
				return res.end(json({ error:"Błąd przy parsowaniu pliku dla wcześniej wykonanej akcji T. Spróbuj ponownie wykonać cały proces." }));
				
			}
			
			if( "queries" in data ){
				
				data = data . queries;
				
				run_queries( data );
				
				return res.end(JSON.stringify({ success:true , load : data . length })) ;
				
			} else {
				
				return res.end(json({ error:"Błąd przy parsowaniu pliku dla wcześniej wykonanej akcji T. Spróbuj ponownie wykonać cały proces. (2)" }));
				
			}
			
		});
		
	} else if( req . action == 'w' ){
		
		pobierz_opinie_z_bazy( function( err , data ){
			
			if( err )
			{
				
				return res.end(json({ error:"Błąd przy pobieraniu opinii z bazy danych.." }));
				
			}
			
			return res . end ( json( { products : data , success : true } ) );
			
		} );
		
	} else if( req . action == 'clear' ){
		
		clear_database();
		
	} else if( req . action == 'csv' ){
		
		generate_csv( function( err , filename ){
			
			if( err ){
				
				return res.end(json({ error:"Błąd przy generowaniu pliku csv.." }));
				
			}
			
			return res . end ( json( { csv : filename , success : true } ) );
			
		} );
		
	} else if( req . action == 'text' ){
		
		generuj_text(function( err , filename ){
			
			if( err ){
				
				return res.end(json({ error:"Błąd przy generowaniu pliku tekstowego.." }));
				
			}
			
			return res . end ( json( { text : filename , success : true } ) );
			
		});
		
	} else{
		
		convert();
		
	}
	
};