const express = require('express'); //express 모듈을 require 함수로 가지고 오겠다
const router = express.Router({ mergeParams: true }); //express모듈에 엤는 rotuer를 소환
//mergeParams란? 상위라우터에서 req.params값을 유지하는 것을 의미 부모와 자식이 상충하는 경우, 자식의 가치를 우선시
// const mysql = require('mysql');
const auth = require('../middlewares/auth'); //미들웨어 파일을 소환
require('date-utils'); //시간관련유틸
const comment = require('./comment'); //코멘트파일을 소환
router.use('/:postId/comments', comment); //코멘트 api들은 '/:postId/comments' 라는 url를 통해 comment로 갈수 있게 해주는 미들웨어
const { db } = require('../example'); //db관련 정보를 담고 있는 example파일을 require 함수로 소환!
// const db = mysql.createConnection({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_DATABASE,
// });

//게시글 작성하기
router.post('/', auth.isAuth, async (req, res) => {
  //post method, 경로는 /post/로 auth.isAuth미들웨어를 거쳐, 요청 응답 객체를 가진 비동기적 api
  try {
    const { postTitle, postIntro, postContent, postImage } = req.body;
    //res.body에 있는 postTitle, postIntro, postContent, postImage 구조분해 할당으로 지정!
    //*객체나 배열에 저장된 데이터 전체가 아닌 일부분만 필요한 경우, 객체나 배열을 변수로 분해 할수 있기 해주는 문법; 구조분해 할당
    const userNickname = req.user.userNickname;
    //userNickname은 req.user에 있는 userNickname
    const newDate = new Date();
    const postTime = newDate.toFormat('YYYY-MM-DD HH24:MI:SS');
    //우분투에서 시간 설정이 영국시간으로 변경되는 경우, sudo ln -sf /usr/share/zoneinfo/Asia/Seoul /etc/localtime 이렇게 지정!
    const params = [
      postTitle,
      userNickname,
      postIntro,
      postContent,
      postImage,
      postTime,
    ]; //코드가 길어지는 걸 간결하게 하기 위해서! params는 배열로 받는다!
    const query =
      'INSERT INTO post(postTitle, userNickname, postIntro, postContent, postImage, postTime) VALUES(?,?,?,?,?,?)';
    await db.query(query, params, (error, rows, fields) => {
      if (error) {
        console.log(`Msg: raise Error in createPost => ${error}`);
        return res.status(400).json({
          success: false,
        });
      }
      console.log(`${postTitle}로 게시글 등록이 완료되었습니다.`);
      return res.status(201).json({
        success: true,
      });
    });
  } catch (err) {
    console.log('게시글 작성 중 발생한 에러: ', err);
    return res.status(500).json({
      success: false,
    });
  }
});

//게시글 조회하기
router.get('/', function (req, res, next) {
  //get method 로 경로 posts/를 통해, 요청, 응답 객체를 가진 api(서버와 데이터베이스에 대한 출입구 역할 허용된 사람들만 접근성 부여)
  try {
    const query = 'select * from post ORDER BY postId DESC;'; //db에서 post테이블에서 postId 내림차순으로 정렬한 모든 데이터를 가지고 오겠다!
    db.query(query, (error, rows) => {
      res.status(200).json({
        success: true,
        posts: rows,//포스트는 db 테이블의 행에 있는 모든 정보!
      });
    });
  } catch (err) {
    console.log('게시글 조회하기 중 발생한 에러: ', err);
    return res.sendStatus(500);
  }
});
// 상세 페이지 포스트 내용 가져오기
// function getDetailPostData(rows) {
//   return {
//     postTitle: rows[0].postTitle,
//     postContent: rows[0].postContent,
//     postTime: rows[0].postTime,
//     postUserNickname: rows[0].postUserNickname,
    //이미지는 가지고 오지 않아도 되낭?***
//   };
// }

//게시글 상세페이지 조회 (DB 한 번 접속후 데이터 가공)
router.get('/:postId', async (req, res) => {
  //get method로 postId라는 경로를 통해, 요청, 응답 객체를 가지고 비동기적 api
  const { postId } = req.params;
  //postId는 url 마지막 /뒤에있는 쿼리문에서 구조분해 할당!
  const query = `
  select 
  post.postId, comment.commentId, postTitle, postContent, post.userNickname as postUserNickname, postTime, commentContent, 
  comment.userNickname as commentUserNickname, commentTime from post 
  left join comment on post.postId = comment.postId WHERE post.postId=${postId}`; //이중 조건인가? **
//만약에 post.postId와 req.params와 같다면, 그리고 post의객체에 postId와, comment의 postId가 같다면, post 테이블의 전체 데이터 베이스와, commnet와 post의 교집합 부분을 가지고 온다!
//쿼리 문을 콘솔로그에 찍어보고 싶네!
  try {
    await db.query(query, (error, rows) => {
      if (error) {
        return false;
      } else {
        res.status(200).json({
          success: true,
          post: getDetailPostData(rows),
          comments: getDetailCommentsData(rows),
        });
      }
    });
  } catch (err) {
    console.log('상세 페이지 조회 기능 중 발생한 에러', err);
    res.status(500).json({
      success: false,
    });
  }
});

// 상세 페이지 조회( Data Base 2번 접속할 경우)
/* router.get('/:postId', async (req, res) => {
  try {
    console.log('상세페이지 조회 라우터 부르기 !');
    const { postId } = req.params;
    const postQuery = `select * from post where postId=${postId}`;
    await db.query(postQuery, async (error, post) => {
      if (error) {
        return false;
      }
      const commentQuery = `select * from comment where postId=${postId}`;
      try {
        await db.query(commentQuery, (error, comments) => {
          if (error) {
            return false;
          }
          res.status(200).json({
            success: true,
            post: post,
            comments: comments,
          });
        });
      } catch (err) {
        console.log(err);
        res.status(500).json({
          success: false,
        });
      }
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
    });
  }
}); */

//게시글 수정
router.patch('/:postId', auth.isAuth, async (req, res) => {
  //patch method로, /post/:postId 경로를 통해 auth.isAuth라는 미들웨어로, 사용자 인증을 검증해서 다시 요청, 응답 객체를 가지고 비동기적으로 처리하는 api
  const userNickname = req.user.userNickname; //여기에서 user는 어디에서 가지고 오남? req.user = data.rows;를 미들웨어에서 가지고 옴
  const { postId } = req.params;
  const { postTitle, postIntro, postContent, postImage } = req.body;
  const escapeQuery = {
    postTitle: postTitle,
    postIntro: postIntro,
    postContent: postContent,
    postImage: postImage,
  }; //excapeQuery는 객체로 정보를 받아와야 함! (쿼리 문이 set일때!)
  const query = `UPDATE post SET ? WHERE postId = ${postId} and userNickname = '${userNickname}'`;
  await db.query(query, escapeQuery, (error, rows, fields) => {
    if (error) {
      res.status(400).json({
        success: false,
        error,
        //에러가 났으면 400코드 응답을 해주고 false라고 해준다!
      });
      return false;
    } else {
      res.status(200).json({
        success: true,
      });
    }
  });
});

// 게시글 삭제
router.delete('/:postId', auth.isAuth, async (req, res) => {
  //delete method로 /post/:postId 경로로 auth.isAuth의 미들웨어를 거쳐, 요청과 응답의 객체를 가지고 비동기적 처리를 하는 api
  const { postId } = req.params; //url의 마지막/뒤에 커리문을 postId로 구조분해 할당
  const userNickname = req.user.userNickname; //닉네임은 미들웨어에서 가지고온 요청의 객체에서 user 안의 userNickname을 userNickname로 변수로 지정
  const query = `DELETE from post where postId = ${postId} and userNickname = "${userNickname}"`;
  //이 쿼리 문의 뜻은 삭제 하자! 포스트를 만약에 포스트 아이디가 포스트 아이디와 같고, userNickname과 로그인한 닉네임이 같다면!
  try {
    await db.query(query, (error, rows, fields) => {
      if (error) {
        console.log('쿼리문 에러 ', error);
        return res.status(400).json({
          //실패했다고 응답값으로 400 코드를 보내줌!
          success: false,
        });
      }
      res.status(200).json({
        success: true,
      });
    });
  } catch (err) {
    res.status(500).json({ err: err });
  }
});

// 상세 페이지 포스트 내용 가져오기
function getDetailPostData(rows) {
  return {
    postTitle: rows[0].postTitle,
    postContent: rows[0].postContent,
    postTime: rows[0].postTime,
    postUserNickname: rows[0].postUserNickname,
    //이미지는 가지고 오지 않아도 되낭?***
  };
}

// 상세페이지 댓글 내용 가져오기 **아직 이해가 안되네, 콘솔로그로 찍어봐야 알것 같다!
function getDetailCommentsData(rows) {
  let comments = [];
  for (let i = 1; i < rows.length; i++) {
    let tmp = {
      commentId: rows[i].commentId, //해당 아이디값을 가지고 오는 이유는 수정 삭제를 용이하기 위해서 인가?
      userNickname: rows[i].commentUserNickname,
      commentContent: rows[i].commentContent,
      commentDate: rows[i].commentTime,
    };
    comments.push(tmp);
  }
  return comments;
}

module.exports = router;
