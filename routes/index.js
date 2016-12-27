var express = require('express');
var router = express.Router();
var MongoClient = require("mongodb").MongoClient;
var url = 'mongodb://localhost:27017/test'; //will be using 'test' database
var jquery = require('jquery');
var NodeGeocoder = require('node-geocoder');
var options = { //needed for geocoding
	provider: 'google',
	httpAdapter: 'https',
	formatter: null
};
var geocoder = NodeGeocoder(options);

/* GET home page. */
router.get('/mailer', function(req, res, next) {
	if (req.user) {
		var loggedin = true;
  		res.render('index', {logged: loggedin});
	}
	else {
		var loggedin = false;
		res.render('index', {logged: loggedin});
	}
});

var contact;
var id_count = 0; // = Math.random() * 50; //Creates random # approx b/w 0 and 50
router.post('/mailer', function(req, res) { //when user makes post request (submits form data), insert contact information into database
	res.render('thanks');
	MongoClient.connect(url, function(err, db) {
		if (err == null) {
			console.log("connected to database server");
		}
		contact = req.body;
		var collection = db.collection('contacts');
		//getting address for geocoding:
		if (contact.Street === undefined) { contact.Street = ""; }
		if (contact.City === undefined) { contact.City = ""; }
		if (contact.State === undefined) { contact.State = ""; }
		if (contact.Zip === undefined) { contact.Zip = ""; }
		var address = contact.Street + ", " + contact.City + " " + contact.State + ", " + contact.Zip;
		var geo;
		geocoder.geocode(address, function(err, res) { //getting geocoding info 
 			//console.log(res);
 			geo = res[0];

 			//dealing with form fields that were not filled out
 			if (contact.radios === undefined) { contact.radios = ""; }
			else { contact.radios += " "; }
			var prefix = contact.radios;
			contact.chkbx_mail === undefined && contact.chkbx_any === undefined ? contact.chkbx_mail = "No" : contact.chkbx_mail = "Yes";
			contact.chkbx_phone === undefined && contact.chkbx_any === undefined ? contact.chkbx_phone = "No" : contact.chkbx_phone = "Yes";
			contact.chkbx_email === undefined && contact.chkbx_any === undefined ? contact.chkbx_email = "No" : contact.chkbx_email = "Yes";
			
			delete contact.chkbx_any;
			for (q in contact) {
				if (contact[q] === undefined || !contact[q]) { contact[q] = "N/A"; }
			}
			id_count = Math.random() * 50;
			collection.insert({_id: id_count, Prefix: prefix, First_Name: contact.First_Name, Last_Name: contact.Last_Name, Street: contact.Street, City: contact.City, State: contact.State, Zip: contact.Zip, 
			Phone: contact.Phone, Email: contact.Email, byPhone: contact.chkbx_phone, byMail: contact.chkbx_mail, byEmail: contact.chkbx_email, lat: geo.latitude, lng: geo.longitude, formatAdr: geo.formattedAddress });
			db.close(); 
		});
		
	}); //end of MongoClient.Connect function
});

var ensureLoggedIn = function(req, res, next) {
	if ( req.user ) { //if successful login, user will be added to all req's
		next();
	}
	else {
		res.redirect("/login");
	}
}

var DBcontacts;
router.get('/contacts', ensureLoggedIn, function(req, res) { //page to view all contact data from db
	MongoClient.connect(url, function(err, db) {
		DBcontacts = db.collection('contacts');
		DBcontacts.find().toArray(function(err, result) {
			if (err) {
				console.log(err);
			}
			else if (!result.length) {
				console.log("No documents found.");
			}
			else {
				//console.log(result.length);
				//console.log(result[0]);
				db.close();
				res.render('contacts', {contacts: result}); 
			}
			
		});
	}); //end of MongoClient.connect

}); //end of router.get

router.post('/update', ensureLoggedIn, function(req, res) { //when user clicks update on a contact on contacts page, look up the contact by id in db, and send info to update page
	var temp = req.body.DBid;
	var db_id = temp.slice(1, req.body.DBid.length - 1); //removing space at first index of id string
	var contactInfo; //will hold data from matching record in databases of requested contact
	
	MongoClient.connect(url, function(err, db) {
		var DBcollection = db.collection('contacts');
		DBcollection.find().toArray(function(err, result) {
			if (err) {
				console.log(err);
			}
			else if (!result.length) {
				console.log("No documents found.");
			}
			else {
				//console.log(result.length);
				//console.log(result);
				for (q in result) {
					if (result[q]._id == db_id) {
						contactInfo = result[q];
						res.render('update', {contact: contactInfo}); 
						break;
					}
				}
			}
		}); 
		db.close();
	});
	//console.log("User wants to update a contact.");
});
router.get('/update', function(req, res){ //there should not be any get requests to this page, so I just redirect them back to contacts if user types in this address
	res.redirect('/contacts');
});

router.post("/thanks", function(req, res) { //updating contact
	var updated_contact = req.body;
	updated_contact.Street = updated_contact.Street.split('-');
	updated_contact.Street = updated_contact.Street.join(' '); //this line and line above remove dashes separating words
	updated_contact.City = updated_contact.City.split('-'); //same with this line and line below, just with city
	updated_contact.City = updated_contact.City.join(' ');

	updated_contact = fixInputs(updated_contact);
	if (updated_contact.radios == "N/A") { updated_contact.radios = ""; }
	//fix chkbx values, maybe just do a loop and manually update everything, test searching by name
	var address = updated_contact.Street + ", " + updated_contact.City + " " + updated_contact.State + ", " + updated_contact.Zip;
	var geo;
	geocoder.geocode(address, function(err, res) { //getting geocoding info 
 		geo = res[0];
 		updated_contact.lat = geo.latitude;
 		updated_contact.lng = geo.longitude;
 		MongoClient.connect(url, function(err, db) {
			console.log(updated_contact.radios);
			var dbcontacts = db.collection('contacts');
			dbcontacts.update({_id: Number(updated_contact.DBid)}, { 
				
				Prefix: updated_contact.radios,
				First_Name: updated_contact.First_Name,
				Last_Name: updated_contact.Last_Name,
				Street: updated_contact.Street,
				City: updated_contact.City,
				State: updated_contact.State,
				Zip: updated_contact.Zip,
				Phone: updated_contact.Phone,
				Email: updated_contact.Email,
				byPhone: updated_contact.chkbx_phone,
				byMail: updated_contact.chkbx_mail,
				byEmail: updated_contact.chkbx_email,
				lat: updated_contact.lat,
				lng: updated_contact.lng,
				formatAdr: geo.formattedAddress
			},
			{ upsert: true }); 

			db.close();
		});

 	});
	res.render('thanks');
});

router.post('/contacts', ensureLoggedIn, function(req, res) { //when user deletes a contact, delete from database and reload contacts
	var toDelete = req.body;
	MongoClient.connect(url, function(err, db) {
		var dbcontacts = db.collection('contacts');
		dbcontacts.deleteOne({_id: Number(toDelete.DBid2)});
		dbcontacts.find().toArray(function(err, result) {
			if (err) {
				console.log(err);
			}
			else if (!result.length) {
				console.log("No documents found.");
			}
			else {
				db.close();
				res.render('contacts', {contacts: result});
			}
		
		});
	});

});

function fixInputs(contact) {
	if (contact.radios === undefined) { contact.radios = ""; }
	//else { contact.radios += " "; } this will continuously add spaces every time updated
	var prefix = contact.radios;
	contact.chkbx_mail === undefined && contact.chkbx_any === undefined ? contact.chkbx_mail = "No" : contact.chkbx_mail = "Yes";
	contact.chkbx_phone === undefined && contact.chkbx_any === undefined ? contact.chkbx_phone = "No" : contact.chkbx_phone = "Yes";
	contact.chkbx_email === undefined && contact.chkbx_any === undefined ? contact.chkbx_email = "No" : contact.chkbx_email = "Yes";
	delete contact.chkbx_any;
	for (q in contact) {
		if (contact[q] === undefined || !contact[q]) { contact[q] = "N/A"; }
	}
	return contact;
}


//*******Occasionally, after entering a few contacts, one of them won't show up in the table unless I reload the page*******
module.exports = router;
//NOTE: Next function is used to immidiately call next route 
//function (in app.js), can pass parameter into next(), just need to
// put parameter in that next function's callback function!