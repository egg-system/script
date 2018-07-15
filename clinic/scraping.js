const puppeteer = require('puppeteer');
const fs = require('fs');

const clinicPage = 'https://clinic.jiko24.jp/surgery-detail/';
const tsvFile = 'output.tsv';

// 郵便番号データをローカルに置いておく
// const postalCodeFile = '/Users/hikaru/Downloads/KEN_ICHIBU_test.CSV';
const postalCodeFile = '/Users/hikaru/Downloads/KEN_ICHIBU.CSV';

// コマンドライン引数の取得
let pageNumber = 1;
if (process.argv[2] !== undefined) {
  pageNumber = Number(process.argv[2]);
}

// ページングのURL
let clinicPageUrl = '';
if (pageNumber === 1) {
  clinicPageUrl = clinicPage;
} else {
  clinicPageUrl = `${clinicPage}page/${pageNumber}`
}
console.log(clinicPageUrl);

if (pageNumber === 1) {
  // ファイルのヘッダー
  // let header = '院名\t住所\t最寄り駅\t診療時間\n';
  // let header = '院名\t住所\t最寄り駅1\t最寄り駅2\t最寄り駅3\t診療時間\n';
  let header = '院名\t郵便番号\t住所\t最寄り駅1\t最寄り駅2\t最寄り駅3\t診療時間\n';
  // tsvに書き込み
  fs.appendFile(tsvFile, header, (err) => {
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

    // 欲しいデータの初期化
    var dataList = [];
    for (var i = 0; i < item.length; ++i){
      // 院名
      var nameBox = item[i].getElementsByClassName("name_box");
      if (nameBox[0] !== undefined) {
        // 末尾の改行を削除
        nameBox = nameBox[0].innerText.replace(/\n+$/g,'');
      } else {
        nameBox = '';
      }

      // 住所
      var access = item[i].getElementsByClassName("access");
      if (access[0] !== undefined) {
        // 末尾の改行を削除
        access = access[0].innerText.replace(/\n+$/g,'');
      } else {
        access = '';
      }

      // 最寄駅
      var typeTrain1 = '';
      var typeTrain2 = '';
      var typeTrain3 = '';
      var typeTrain = item[i].getElementsByClassName("type_train");
      if (typeTrain[0] !== undefined) {
        // 末尾の改行を削除
        typeTrain = typeTrain[0].innerText.replace(/\n+$/g,'');
        // 不要な文字列は削除
        typeTrain = typeTrain.replace(/最寄り駅： /g,'');
        typeTrain = typeTrain.replace(/ $/g,'');
        // 駅がスペース区切られているので分割する
        var typeTrainArray = typeTrain.split(' ');
        typeTrain1 = (typeTrainArray[0] !== undefined) ? typeTrainArray[0] : '';
        typeTrain2 = (typeTrainArray[1] !== undefined) ? typeTrainArray[1] : '';
        typeTrain3 = (typeTrainArray[2] !== undefined) ? typeTrainArray[2] : '';

        // 3つ以上ある場合の処理
        /*
        if (typeTrainArray[2] !== undefined) {
          for (var num = 2; num < typeTrainArray.length; ++num) {
            typeTrain3 += `${typeTrainArray[num]},`;
          }
          // 末尾のカンマを削除
          typeTrain3 = typeTrain3.replace(/,+$/g,'');
        }
        */
      }

      // 診療時間
      var time = item[i].getElementsByClassName("s_time");
      if (time[0] !== undefined) {
        // 末尾の改行を削除
        time = time[0].innerText.replace(/\n+$/g,'');
      } else {
        time = '';
      }

      var output = `${nameBox}\t${access}\t${typeTrain1}\t${typeTrain2}\t${typeTrain3}\t${time}`
      dataList.push(output);
    }
    return dataList;
  });

  await browser.close();

  // 郵便番号のデータを取得
  const postalCodeData = await readPostalCodeFile();

  // ファイルへの書き込みするデータの処理
  for (let value of data) {
    // 全郵便番号と総当たりで検索する
    let postalCode = '';
    for (let postal of postalCodeData) {
      if (value.indexOf(postal['address']) !== -1) {
        postalCode = postal['number'];
        break;
      }
    }

    // fileData += `${value}\n`;

    // 郵便番号を追加する
    // fileData += `${postalCode}\t${value}\n`;
    // 一旦配列に分割する
    const valueArray = value.split('\t');
    // 順番を変えて文字列にする
    const lineData = `${valueArray[0]}\t${postalCode}\t${valueArray[1]}\t${valueArray[2]}\t${valueArray[3]}\t${valueArray[4]}\t${valueArray[5]}`;
    fileData += `${lineData}\n`;
  }

  // tsvに書き込み
  fs.appendFile(tsvFile, fileData, (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log('書き込み終了');
    }
  });
})()

// 非同期でファイルを読み込みPromiseを返す関数を定義
const readPostalCodeFile = () => {
  return new Promise((resolve, reject) => {
    // 最終的に返す郵便番号のデータ
    let postalCodeData = [];
    fs.readFile(postalCodeFile, (err, text) => {
      const line = String(text);
      const lineArray = line.split('\n');

      // ファイルのデータを1行ずつ処理
      for (let lineData of lineArray) {
        // スペース区切りでデータを取得
        const lineDataArray = lineData.split(' ');
        let tmp = {};
        if (lineDataArray[0] !== '') {
          // 郵便番号
          tmp.number = lineDataArray[0];
          // 残りが住所データ
          tmp.address = `${lineDataArray[1]}${lineDataArray[2]}${lineDataArray[3]}`;
          // まとめて配列に追加
          postalCodeData.push(tmp);
        }
      }
      resolve(postalCodeData)

      if (err) {
        console.log(err);
        resolve(err)
      }
    });
  });
}
