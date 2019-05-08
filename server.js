//  OpenShift sample Node application
var express = require('express'),
    app     = express(),
    morgan  = require('morgan');

var multer  =   require('multer');  //파일 업로드 //ocr-----------------
    
Object.assign=require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";

if (mongoURL == null) {
  var mongoHost, mongoPort, mongoDatabase, mongoPassword, mongoUser;
  // If using plane old env vars via service discovery
  if (process.env.DATABASE_SERVICE_NAME) {
    var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase();
    mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'];
    mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'];
    mongoDatabase = process.env[mongoServiceName + '_DATABASE'];
    mongoPassword = process.env[mongoServiceName + '_PASSWORD'];
    mongoUser = process.env[mongoServiceName + '_USER'];

  // If using env vars from secret from service binding  
  } else if (process.env.database_name) {
    mongoDatabase = process.env.database_name;
    mongoPassword = process.env.password;
    mongoUser = process.env.username;
    var mongoUriParts = process.env.uri && process.env.uri.split("//");
    if (mongoUriParts.length == 2) {
      mongoUriParts = mongoUriParts[1].split(":");
      if (mongoUriParts && mongoUriParts.length == 2) {
        mongoHost = mongoUriParts[0];
        mongoPort = mongoUriParts[1];
      }
    }
  }

  if (mongoHost && mongoPort && mongoDatabase) {
    mongoURLLabel = mongoURL = 'mongodb://';
    if (mongoUser && mongoPassword) {
      mongoURL += mongoUser + ':' + mongoPassword + '@';
    }
    // Provide UI label that excludes user id and pw
    mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
    mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;
  }
}
var db = null,
    dbDetails = new Object();

var initDb = function(callback) {
  if (mongoURL == null) return;

  var mongodb = require('mongodb');
  if (mongodb == null) return;

  mongodb.connect(mongoURL, function(err, conn) {
    if (err) {
      callback(err);
      return;
    }

    db = conn;
    dbDetails.databaseName = db.databaseName;
    dbDetails.url = mongoURLLabel;
    dbDetails.type = 'MongoDB';

    console.log('Connected to MongoDB at: %s', mongoURL);
  });
};

app.get('/', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    var col = db.collection('counts');
    // Create a document with request IP and current time of request
    col.insert({ip: req.ip, date: Date.now()});
    col.count(function(err, count){
      if (err) {
        console.log('Error running count. Message:\n'+err);
      }
      res.render('index.html', { pageCountMessage : count, dbInfo: dbDetails });
    });
  } else {
    res.render('index.html', { pageCountMessage : null});
  }
});

app.get('/pagecount', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    db.collection('counts').count(function(err, count ){
      res.send('{ pageCount: ' + count + '}');
    });
  } else {
    res.send('{ pageCount: -1 }');
  }
});

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

//ocr-----------------------------------------------------------------------------------

app.post('/dscocr',function(req,res) {
    var storage =   multer.diskStorage({
        
        destination: function (req, file, cb) {                 // 파일 업로드 경로 지정
          cb(null, './uploads');          //운영 linux
          //cb(null, 'D:/Python/uploads');    //로컬 개발
        },
        
        filename: function (req, file, cb) {                    //파일 업로드 처리
          console.log("file.originalname:"+file.originalname);
 
          //upfilename = Date.now()+"_"+file.originalname         //날짜 + 시간 + 원래 파일명
          upfilename = file.originalname         //날짜 + 시간 + 원래 파일명
          cb(null, upfilename );
          console.log("upfilename:"+upfilename);
          temp2 = upfilename;
        }
      }); 

    var upload = multer({ storage : storage}).single('ocrfile'); //client 에서 호출명

    console.log("app post /dscocr"); 

    upload(req,res,function(err) {
        if(err) {
            return res.end("Error uploading file.");
        }else{
            console.log(req.body);      //client 에게  받은 파라미터
            console.log("doccode:"+req.body.doccode);
        }

        //파이썬 호출----------------------------------
        var spawn = require('child_process').spawn,
        //py = spawn('python',['D:/Python/MS OCR/nodejs_call_data.py']),  //파이썬 호출 파일
        py = spawn('python',['./python/nodejs_call_data.py']),  //운영 linux
        
        data = {"param1":"v1","param2":"v2"},       //파이썬에 전달할 파라미터
        dataString = "";
        py.stdout.on('data',function(data){
            dataString += data.toString();
        });
        py.stdout.on('end',function(){ 
            //결과 리턴 -----------------------------------------
            res.writeHead(200,{"content-Type":"text/html; charset=utf-8"});
            //res.write("File is uploaded:",res.filename)
            res.write("File is uploaded:"+dataString);
            res.end();
            console.log('결과:'+dataString);
        });
        py.stdin.write(JSON.stringify(data));       //파이썬 실행
        py.stdin.end();
        //--------------------------------------------------


    }); 

});
 

app.get('/filedownload',function(req,res) {
    //console.log(req.body);      //client 에게  받은 파라미터
    console.log("download filename:"+req.query.filename);
    //res.send("key1:"+req.query.key1);
    /*
    fs.readFile('./uploads/'+req.query.key1,function(req,res){
        res.writeHead(200,{"content-Type":"text/html"});
        res.end(data);
    });
    */
    //res.download('D:/Python/uploads/'+req.query.filename);
    res.send("download filename:"+req.query.filename);
    //console.log("download filename:"+req.query.filename);
    //res.download('./uploads/'+req.query.filename);
});
 
 
//ocr--end---------------------------------------------------------------------------------

initDb(function(err){
  console.log('Error connecting to Mongo. Message:\n'+err);
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;
