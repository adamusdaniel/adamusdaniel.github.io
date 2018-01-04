

/*

	W technologii Node.js router odpowiada za generowanie odpowiedzi dla zapytań przeglądarki.
	
	zmienna router przyjmuje instrukcje co robić w przypadku zapytań GET oraz POST.
	
	W naszym wypadku GET to wywołanie głównej strony, a POST to kliknięcia przycisków.

*/


module.exports = function( router , db , local , fs ){
	
	local = function(e){return require(__dirname+"/"+e)};
	
	/*
	
		W Node.js funkcja require odwołuje się do modułu.
		
		funkcja local wywołuje funkcję require w folderze roboczym.
		
		__dirname - zmienna zawierająca folder roboczy
	
	*/
	
	fs = require('fs'); // fs - filesystem ( moduł odpowiadający za interakcję z plikami - odczyt, zapis)
	
	
	router.get("/",function(req,res){ // zapytanie typu GET o stronę główną (/)
	
	/*	
	
		req - zapytanie
			
			request, czyli zawiera pola zapytania (czyli na przykład akcję - W, CLEAR , ETL , E , T , L )
			
		res - odpowiedź
		
			response - czyli jak odpowiadamy (generujemy odpowiedź i umieszczamy ją w zmiennej res)
	
	*/
		
		return local("template.min.js")(req,res,db); // odwołanie do pliku template (generowanie strony głównej)
		
		/*
		
			db - baza danych
		
		*/
		
	});
	
	router.get("/*.json*",function(req,res){ // zapytanie GET o plik typu .json
	
	/*
	
		https://pl.wikipedia.org/wiki/JSON - język JSON
		
		
	
	*/
		
		res.writeHead('204'); // odpowiadamy 204 No Content i zapisujemy do zmiennej res
		
		/*
		
			Jeśli jeszcze nie ma pliku JSON, to odpowiadamy, że nic tu nie ma ==> przeglądarka czeka
		
		*/
		
		res.end();
		
	});
	
	router.get("*",function(req,res){
		
		/*
		
			kiedy zapytamy o podstronę, której nie ma , przenosi nas do strony głównej
		
		*/
		
		res.writeHead('301',{'Location':'http://ishort.pl/etl'});
		
		res.end();
		
	});
	
	router.post("*",function(req,res){
		
		/*
		
			zapytanie typu POST ( generowane przez każdy przycisk ) ==> każdy przycisk ma parametr (akcja W,CLEAR, itd.) przekazywany w zmiennej req
		
		*/
		
		return local("post.min.js")(req,res,db); // każde zapytanie typu POST idzie do pliku post.min.js
		
	});
	
	return router;
	
};