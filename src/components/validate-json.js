import fs from 'fs';

try {
  const data = fs.readFileSync('a.json', 'utf8');
  console.log('File length:', data.length);
  
  const parsed = JSON.parse(data);
  console.log('✅ JSON is valid');
  console.log('courseData length:', parsed.courseData?.length || 0);
  console.log('courseData type:', Array.isArray(parsed.courseData) ? 'array' : typeof parsed.courseData);
  
  if (parsed.courseData && parsed.courseData.length > 0) {
    console.log('First phase:', parsed.courseData[0].id);
    console.log('First phase slides:', parsed.courseData[0].slides?.length || 0);
  }
} catch (error) {
  console.log('❌ JSON is invalid:');
  console.log(error.message);
  
  // 尝试找到错误位置
  const match = error.message.match(/position (\d+)/);
  if (match) {
    const position = parseInt(match[1]);
    const data = fs.readFileSync('a.json', 'utf8');
    console.log('Error context:', data.substring(Math.max(0, position - 50), position + 50));
  }
}
