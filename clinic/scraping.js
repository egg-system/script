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
  let header = '院名\t郵便番号\t住所\t最寄り駅1\t最寄り駅2\t最寄り駅3\t診療時間\n';
  // let header = '院名\t郵便番号\t住所\t最寄り駅1\t最寄り駅2\t最寄り駅3\t診療時間\t診療時間html\n';
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

    // 欲しいデータの初期化
    // var dataList = [];
    var dataList = {};
    dataList.text = [];
    dataList.url = [];

    // メインのコンテンツだけに絞る
    var data = document.getElementsByClassName("maintop4");
    var item = data[0].getElementsByClassName("item");

    for (var i = 0; i < item.length; ++i){
      // 院名
      var nameBox = item[i].getElementsByClassName("name_box");
      if (nameBox[0] !== undefined) {
        // 改行を全て削除
        nameBox = nameBox[0].innerText.replace(/\r?\n/g,'');
      } else {
        nameBox = '';
      }

      // 病院の詳細ページのURLを取得
      var nameUrl = item[i].getElementsByTagName('a');
      if (nameUrl[0] !== undefined) {
        nameUrl = nameUrl[0].getAttribute('href');
      } else {
        nameUrl = '';
      }
      dataList.url.push(nameUrl);

      // 住所
      var access = item[i].getElementsByClassName("access");
      if (access[0] !== undefined) {
        // 改行を全て削除
        access = access[0].innerText.replace(/\r?\n/g,'');
      } else {
        access = '';
      }

      // 最寄駅
      var typeTrain1 = '';
      var typeTrain2 = '';
      var typeTrain3 = '';
      var typeTrain = item[i].getElementsByClassName("type_train");
      if (typeTrain[0] !== undefined) {
        // 改行を全て削除
        typeTrain = typeTrain[0].innerText.replace(/\r?\n/g,'');
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
        // 改行を全て削除
        time = time[0].innerText.replace(/\r?\n/g,'');
        // タブを全てスペースに置換
        time = time.replace(/\t/g,' ');
      } else {
        time = '';
      }

      var output = `${nameBox}\t${access}\t${typeTrain1}\t${typeTrain2}\t${typeTrain3}\t${time}\t${nameUrl}`
      dataList.text.push(output);
    }
    return dataList;
  });

  // 郵便番号のデータを取得
  const postalCodeData = await readPostalCodeFile();
  // ファイルへの書き込みするデータの処理
  for (let value of data.text) {
    // 全郵便番号と総当たりで検索する
    let postalCode = '';
    for (let postal of postalCodeData) {
      // 病院の住所の中に郵便番号の住所が含まれて入れば郵便番号を使う
      if (value.indexOf(postal['address']) !== -1) {
        postalCode = postal['number'];
        break;
      }
    }

    // 一旦配列に分割する
    const valueArray = value.split('\t');

    console.log('詳細ページに遷移');
    const url = valueArray[6];
    console.log(url);
    await page.goto(url);
    const htmlData = await page.evaluate(() => {
      // 以下ブラウザで動くコードを書く
      var table = document.getElementsByClassName("time_table");
      var html = '';
      // htmlをそのまま返す
      if (table[0] !== undefined) {
        html = table[0].outerHTML;
        // 改行を全て削除
        html = html.replace(/\r?\n/g,'');
      }
      return html
    });

    // 順番を変えて郵便番号を追加する
    fileData += `${valueArray[0]}\t${postalCode}\t${valueArray[1]}\t${valueArray[2]}\t${valueArray[3]}\t${valueArray[4]}\t${htmlData}\n`;
    // fileData += `${valueArray[0]}\t${postalCode}\t${valueArray[1]}\t${valueArray[2]}\t${valueArray[3]}\t${valueArray[4]}\t${valueArray[5]}\t${url}\n`;
  }

  await browser.close();

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
