const express = require('express'); //express 웹 프레임 워크를 require 함수로 가지고 옴
const router = express.Router({ mergeParams: true }); //express 웹프레임워크에서 라우터를 가지고 오자!(상위 라루터에서 req.params 값을 유지하는 것을 의미 부모 자식과 상충하는 경우 자식의 가치를 좀 더 우선시 함)
const auth = require('../middlewares/auth'); //사용자 인증 미들웨어를 require 함수로 가지고 옴
// const mysql = require('mysql');
const { db } = require('../example'); //db 설계한 파일을 가지고 오겠다! 선언

//댓글 작성
router.post('/', auth.isAuth, async (req, res) => {
  //post method로 경로는 /post/로 auth.isAuth의 미들웨어의 경로로 요청 응답 객체를 가지고 비동기 처리하는 api
  try {
    const commentContent = req.body.commentContent; //본문에 적힌 댓글
    const { postId } = req.params; //url 제일 뒤에 있는 /에 적힌 파라미타
    const userNickname = req.user.userNickname; //사용자 인증 미들웨어에서 user 객체에서 받아온 nickname
    const newDate = new Date(); //날짜 지정
    const commentTime = newDate.toFormat('YYYY-MM-DD HH24:MI:SS'); //날짜 형식 지정
    const params = [commentTime, commentContent, userNickname, postId]; //into는 params를 배열로 지정 해줘야 함
    const query =
      'INSERT INTO comment(commentTime, commentContent, userNickname, postId) VALUES(?,?,?,?)';
    await db.query(query, params, (error, rows, fields) => {
      //*이 뜻에 대해서 좀 더 자세히 알아보자!
      if (error) {
        console.log(`Msg: raise Error in createComment => ${ error }`);
        return res.status(400).json({
          //잘못된 파라미타 입력으로 400 코드 응답
          success: false,
        });
      }
      console.log(`댓글 등록이 완료되었습니다.`);
      return res.status(201).json({
        success: true,
      });
    });
  } catch (err) {
    console.log('댓글 작성 중 발생한 에러: ', err);
    return res.status(500).json({
      success: false,
    });
  }
});

//댓글 수정
router.patch('/:commentId', auth.isAuth, async (req, res) => {
  //patch method로 /post/:commentId라는 경로로, 사용자 인증 미들웨어를 거쳐, 요청 응답객체를 가지고 비동기 api
  const { commentId } = req.params; //res.params는 url을 분석하여 id와 name자리에 있는 값을 낚아 챈다.
  const { commentContent } = req.body; //댓글은 본문에서 가지고 온다
  const userNickname = req.user.userNickname; //닉네임은 사용자 인증 미들웨어를 거친후 받은 req.user에서 닉네임 값을 가지고 온다
  const escapeQuery = {
    commentContent: commentContent,
  }; //익스케이프 쿼리는 무엇일까? (객체로 지정 해줬군!)
  const query = `UPDATE comment SET ? WHERE commentId = '${commentId}' and userNickname = '${userNickname}'`;
  await db.query(query, escapeQuery, (error, rows, fields) => {
    if (error) {
      res.status(400).json({
        success: false,
        error,
      });
      return false;
    } else if (rows.affectedRows === 0) {
      res.status(401).json({
        success: false,
      });
    } else {
      res.status(200).json({
        success: true
      });
    }
  });
});

//댓글삭제
router.delete('/:commentId', auth.isAuth, async (req, res) => {
  const { commentId } = req.params;
  const userNickname = req.user.userNickname;
  const query = `DELETE from comment where commentId = '${commentId}'  and userNickname = '${userNickname}'`;
  try {
    await db.query(query, (error, rows, fields) => {
      if (error) {
        console.log('쿼리문 에러 ', error);
        return res.status(400).json({
          success: false,
        });
      } else if (rows.affectedRows === 0) {
        res.status(401).json({
          success: false
        })
      } else {
        res.status(200).json({
          success: true,
        })
      }
    });
  } catch (err) {
    res.status(500).json({ err: err });
  }
});

module.exports = router;