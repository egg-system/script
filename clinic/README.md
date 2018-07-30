### usage
* 郵便番号のデータを以下から取得する
  * http://www.post.japanpost.jp/zipcode/dl/kogaki/zip/ken_all.zip
* 必要なデータだけ抽出
  * 郵便番号と住所のデータ
  ```
  $ cat KEN_ALL.CSV | awk -F'[,]' '{ a = substr($3, 2); sub(/.$/,"",a); b = substr($7, 2); sub(/.$/,"",b); c = substr($8, 2); sub(/.$/,"",c); d = substr($9, 2); sub(/.$/,"",d);print a,b,c,d }' > KEN_ICHIBU.CSV
  ```
  * 都道府県のデータ
  ```
  $ cat KEN_ALL.CSV | awk -F'[,]' '{ b = substr($7, 2); sub(/.$/,"",b);print b }' | uniq > TODOHUKEN.CSV
  ```
  * 市区町村のデータ
  ```
  $ cat KEN_ALL.CSV | awk -F'[,]' '{ c = substr($8, 2); sub(/.$/,"",c);print c }' | uniq > SHIKUCHOSON.CSV
  ```
* 郵便番号のデータファイルをローカルに置いて以下実行
```
$ npm install

$ ./roop.sh
```
