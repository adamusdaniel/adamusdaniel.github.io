module.exports = function( req , res , db , fs , files , files_count , end_response , jsdom , local , u_id , _  ){
	
	
	/*
	
		plik template odpowiada za generowanie strony głównej (jako odpowiedź na zapytanie typu GET o stronę "/" )
	
	*/
	
	
	
	_ = function( word ){
		
		return "{["+word+"]}";
		
	};
	
	
	String.prototype.podziel = function( word ){
		
		return this.split( _(word) );
		
	};
	
	
	
	
	u_id = function(S4) {
				S4 = function() {
				   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
				};
				return "c"+(S4()+S4()+S4()+S4()+S4()+S4()+S4()+S4());
			};
	
	
	
	
	
	local = function(e){return require(__dirname+"/"+e)}; // tak jak w pliku router
	
	jsdom = require("jsdom"); // jsdom to moduł odpowiadający za realizowanie funkcji transform ==> tworzy środowisko przeglądarki na serwerze (możemy się odwoływać do znaczników HTML ( document, body ) ==> pobiera plik HTML z Ceneo i "urachamia przeglądarkę" po stronie serwera, tak żeby można było zczytać jakieś własnośći (model, marka, opinie).
	
	fs = require('fs'); // filesystem (tak jak w router.js)
	
	files = {
		
		/*
		
			zmienna files zawiera obiekt zawierający wszystkie pliki, które ładujemy, żeby wyświetlić stronę główną
			
			klucz: "wartość"
		
		*/
	
		html:"index.html" ,
		css:"style.min.css" ,
		js:"script.min.js" ,
		tocca:/*"oldtocca.js"*/ "tocca.js" , // moduł odpowiadający za przyciskanie przycisków
		main : "main.html",

	};
	
	
	
	
	/*
	
		------------------------------------------
		
		ten fragment kodu odpowiada za ładowanie plików przy użyciu modułu fs (filesystem) do pamięci
		
		zastępuje w obiekcie files nazwy plików zawartością tych plików (klucz zostaje, podmieniona zostaje wartość)
	
	*/
	
	
	
	
		
	files_count = Object.keys(files).length; // liczymy ile jest plików
	
	Object.keys(files).forEach(function( el ){
		
		/*
		
			forEach - funkcja przechodząca po każdym elemencie tablicy (Array) ==> dla każdego elementu wywoływana jest funkcja podana jako argument forEach
			
			ZOBACZ ===> zakładki Nauka ==> Array.prototype.forEach
		
		*/
		
		(function( files , el ){fs.readFile( __dirname+"/client/"+files[el] , 'utf8' , function(err,data){
			
			if(err) // jeśli wystąpi bład odczytu pliku
				return console.log("Nie udało się załadować plików ETL Ewa Kołodziejczyk.."),res.end("Błąd serwera. Przepraszamy.");
			
			// console to konsola serwera (logi serwera) ==> nie widzi tego klient
			
			// klientowi (przeglądarce) piszemy błąd serwera. 
			
			files[el] = data; // do obiektu files podpisujemy treść plików na miejsce ich nazw
			
			if( ! ( --files_count ) ) // jeśli nie ma już plików do odczytania
				return end_response(); // wyrzuć odpowiedź do response
				
				/*
				
					--files_count ==> dekrementacja (Wikipedia) ==> zmniejszenie o 1
					
					! ==> "nie" - negacja
					
					w JavaScript każda liczba oprócz 0 daje true ==> 0 daje false
				
				*/
			
		} );})( files , el );
		
		
		/*
		
			fs.readFile - odczytanie pliku
			
			ZOBACZ ===> zakładki Nauka ==> fs.readFile
		
		*/
		
	});
	
	
	/*
	
		------------------------------------------
	
	*/
	
	
	
	
	
	
	end_response = function(  ){
		
		
		
		res.end(files.html
		
			.podziel("css")
				.join(files.css)
				
				/*
				
					na miejsce {[css]} wsadzamy files.css
				
				*/
			
			.podziel("js")
				.join(files.tocca+files.js)
			
			.podziel("body_content")
				.join( files . main )
		
		);
		
	};
	
};