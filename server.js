//https://medium.com/@chiragpatel_52497/file-upload-in-node-js-server-f763a0781ccd
var express =   require("express"); 
var multer  =   require('multer');  //파일 업로드
var app     =   express();  
 

app.post('/fileUpload',function(req,res) {
    var storage =   multer.diskStorage({
        
        destination: function (req, file, cb) {                 // 파일 업로드 경로 지정
          cb(null, './uploads');
        },
        
        filename: function (req, file, cb) {                    //파일 업로드 처리
          console.log("file.originalname:"+file.originalname);
 
          upfilename = Date.now()+"_"+file.originalname         //날짜 + 시간 + 원래 파일명
          cb(null, upfilename );
          console.log("upfilename:"+upfilename);

        }
      }); 

    var upload = multer({ storage : storage}).single('uploadFile'); //client 에서 호출명

    console.log("app post /fileUpload"); 

    upload(req,res,function(err) {
        if(err) {
            return res.end("Error uploading file.");
        }else{
            console.log(req.body);      //client 에게  받은 파라미터
            console.log("key1:"+req.body.key1);
        }

        //파이썬 호출----------------------------------
        var spawn = require('child_process').spawn,
        py = spawn('python',['D:/Python/MS OCR/nodejs_call_data.py']),  //파이썬 호출 파일
        data = {"param1":"v1","param2":"v2"},       //파이썬에 전달할 파라미터
        dataString = "";
        py.stdout.on('data',function(data){
            dataString += data.toString();
        });
        py.stdout.on('end',function(){
            console.log('결과:'+dataString);
        });
        py.stdin.write(JSON.stringify(data));       //파이썬 실행
        py.stdin.end();
        //--------------------------------------------------

        //결과 리턴 -----------------------------------------
        res.writeHead(200,{"content-Type":"text/html; charset=utf-8"})
        //res.write("File is uploaded:",res.filename)
        res.write("File is uploaded:",dataString)
        res.end();
    }); 

});
 
  

app.listen(3000,function(){
    console.log("Working on port 3000");
});
