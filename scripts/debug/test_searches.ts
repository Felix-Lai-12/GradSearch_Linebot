import { parseKeyword } from '../../src/parsers/keyword';

async function test() {
  console.log(await parseKeyword("元智大學資工所"));
  console.log(await parseKeyword("中央資工"));
}
test();
