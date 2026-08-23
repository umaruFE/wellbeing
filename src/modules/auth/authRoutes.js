// 绘本歌曲制作人无权访问工作看板。如果默认返回根路径，会在
// “/” 和 “/unauthorized” 之间形成跳转循环。
export const getDefaultRouteForRole = (role) => (
  role === 'picture_song_creator' ? '/picture-books' : '/'
);
