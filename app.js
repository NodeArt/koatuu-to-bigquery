const fs = require('fs');
const JSONStream = require('JSONStream');
const os = require('os');

require('dotenv').config();

const { createTable, getTable, insertData } = require('./bigquery');

const FIRST_LEVEL = 'Перший рівень';
const SECOND_LEVEL = 'Другий рівень';
const THIRD_LEVEL = 'Третій рівень';
const FOURTH_LEVEL = 'Четвертий рівень';
const CATEGORY = 'Категорія';
const NAME = "Назва об'єкта українською мовою";

const levels = {};
const rows = [];

const getStream = () => {
  //  todo: env || fallback
  const jsonData = `${os.tmpdir()}/koatuu.json`;
  const stream = fs.createReadStream(jsonData, {
    encoding: 'utf8',
  });
  const parser = JSONStream.parse('*');
  return stream.pipe(parser);
};

const parseData = (stream) => {
  stream
    .on('data', async (data) => {
      if (
        data[FIRST_LEVEL] &&
        !data[SECOND_LEVEL] &&
        !data[THIRD_LEVEL] &&
        !data[FOURTH_LEVEL] &&
        !levels[data[FIRST_LEVEL]]
      ) {
        levels[data[FIRST_LEVEL]] = data[NAME];
      }

      if (
        data[SECOND_LEVEL] &&
        +data[SECOND_LEVEL].toString().slice(3, 5) &&
        !data[THIRD_LEVEL] &&
        !data[FOURTH_LEVEL] &&
        !levels[data[SECOND_LEVEL]]
      ) {
        levels[data[SECOND_LEVEL]] = data[NAME];
      }

      if (
        data[THIRD_LEVEL] &&
        +data[THIRD_LEVEL].toString().slice(6, 8) &&
        !data[FOURTH_LEVEL] &&
        !levels[data[THIRD_LEVEL]]
      ) {
        levels[data[THIRD_LEVEL]] = data[NAME];
      }

      if (data[CATEGORY]) {
        const code = [
          data[FIRST_LEVEL],
          data[SECOND_LEVEL],
          data[THIRD_LEVEL],
          data[FOURTH_LEVEL],
        ].filter((level) => level);
        // fix me
        try {
          rows.push(
            insertData([
              {
                Code: code[code.length - 1].toString(),
                Region: levels[data[FIRST_LEVEL]],
                City: levels[data[SECOND_LEVEL]],
                District: levels[data[THIRD_LEVEL]] || '',
                Village: data[FOURTH_LEVEL] ? data[NAME] : '',
              },
            ]),
          );
        } catch (err) {
          console.error(err);
        }
      }
    })
    .on('end', () => {
      Promise.allSettled(rows).then((results) =>
        results.forEach((res) => console.log(res)),
      );
      console.log(rows.length);
      console.log('end export');
    });
};

const main = async () => {
  //  no need tin try catch
  try {
    await getTable();
    const stream = getStream();
    parseData(stream);
  } catch (err) {
    console.error(err);
    // wrong layer, hide it inside
    try {
      await createTable();
      getTable().then(() => {
        const stream = getStream();
        parseData(stream);
      });
    } catch (err) {
      console.error(err);
    }
  }
};

main();
