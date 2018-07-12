const puppeteer = require('puppeteer');
const fs = require('fs');

const clinicPage = 'https://clinic.jiko24.jp/surgery-detail/';
const tsvFile = 'output.tsv';
const lastPage = 3;

// コマンドライン引数の取得
let pageNumber = 1;
if (process.argv[2] !== undefined) {
  pageNumber = process.argv[2];
}

// ページングのURL
let clinicPageUrl = '';
if (pageNumber === '1') {
  clinicPageUrl = clinicPage;
} else {
  clinicPageUrl = `${clinicPage}page/${pageNumber}`
}
console.log(clinicPageUrl);

if (pageNumber === '1') {
  // ファイルのヘッダー
  let header = '院名\t住所\t最寄り駅\t診療時間\n';
  // tsvに書き込み
  fs.appendFile(tsvFile, header, function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log('ヘッダー書き込み終了');
    }
  });
}

// ファイルに書き込む内容
let fileData = '';

(async() => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(clinicPageUrl);

  const data = await page.evaluate(() => {
    // 以下ブラウザで動くコードを書く

    // メインのコンテンツだけに絞る
    var data = document.getElementsByClassName("maintop4");
    var item = data[0].getElementsByClassName("item");
    var list = data[0].getElementsByClassName("name_box");

    // 欲しいデータの初期化
    var dataList = [];
    for(var i = 0; i < item.length; ++i){
      // 院名
      var nameBox = item[i].getElementsByClassName("name_box");
      if (nameBox[0] !== undefined) {
        nameBox = nameBox[0].innerText.replace(/\n+$/g,'');
      } else {
        nameBox = '';
      }

      // 住所
      var access = item[i].getElementsByClassName("access");
      if (access[0] !== undefined) {
        access = access[0].innerText.replace(/\n+$/g,'');
      } else {
        access = '';
      }

      // 最寄駅
      var typeTrain = item[i].getElementsByClassName("type_train");
      if (typeTrain[0] !== undefined) {
        typeTrain = typeTrain[0].innerText.replace(/\n+$/g,'');
        typeTrain = typeTrain.replace(/最寄り駅： /g,'');
        typeTrain = typeTrain.replace(/ $/g,'');
        typeTrain = typeTrain.replace(/ /g,',');
      } else {
        typeTrain = '';
      }

      // 診療時間
      var time = item[i].getElementsByClassName("s_time");
      if (time[0] !== undefined) {
        time = time[0].innerText.replace(/\n+$/g,'');
      } else {
        time = '';
      }

      var output = `${nameBox}\t${access}\t${typeTrain}\t${time}`
      dataList.push(output);
    }
    return dataList;
  });

  await browser.close();

  // ファイルへの書き込み
  for(let value of data) {
    fileData += `${value}\n`;
  }

  // tsvに書き込み
  fs.appendFile(tsvFile, fileData, function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log('書き込み終了');
    }
  });
})()
