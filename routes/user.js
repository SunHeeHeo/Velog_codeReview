const express = require('express');//express 모듈을 require함수를 이용해서 불러옴
const router = express.Router(); //익스프레스라는 모듈안에 라우터를 소환하겠다.
// const mysql = require('mysql');
// const auth = require('../middlewares/auth');
const bcrypt = require('bcrypt'); //비크립트 모듈 소환
const setRounds = 10; //해쉬함수 최대 10자리로 fix
const jwt = require('jsonwebtoken'); //json web token이란 선택적 암호화를 사용하여 데이터를 만들기 위한 인터넷 표준
require('dotenv').config(); //환경 변수를 파일에 저장할수 있도록 해주는 dotenv 라이브러리를 불러옴
const { db } = require('../example'); //디비 모듈은 example이라는 폴더 안에 있다.
//폴더안에는 특정 함수로, db접속 정볼르 답고 있다.
//**항상 app.js파일에 먼저 갔다가 오는 것인가?

// 회원가입
router.post('/signup', async (req, res) => {
  try {
    let { userEmail, userNickname, userPw, userPwCheck } = req.body;
//회원 가입은 클라이언트 단에서 정보를 보내주는 거라, post 라는 method를 사용!
//url은 /users(미들웨어)/signup을 통해서 정보들을 받겠다라는 말이다! 
//어떤 정보들을 가지냐면? req(익스프레스 요청 객체, 요청객체는 서버를 요청한 클라이언트 정보를 담고 있음)객체, 
//res(응답 객체, 요청한 클라이언트에게 응답하기 위한 함수들로 구성된 객체)객체를 가지고 비동기 적은 방식으로 api를 구성
    // 이메일 형식이 아닌 경우
    if (!emailFormCheckCheck(userEmail)) {
      return res.status(400).json({
        success: false,
        errMessage: '올바른 이메일형식을 입력해주세요.',
      }); //만약에 유저 이메일이 형식에 맞지 않는다면, 400에러 (클라이언트에서 파라미터를 포함해 서버api를 요청하는데 파라미터가 잘못 되었을 경우!)
    }
    if (!checkMatchingPassword(userPw, userPwCheck)) {
      // 잘못된 요청인 경우
      return res.status(400).json({
        success: false,//만약에 유저가 비밀번호와 비밀번호 확인 입력값이 동일하지 않는다면 400에러
      });
    }
    // userEmail 중복 여부
    if (await checkUserEmailValidation(userEmail)) {
      console.log('email이 중복 되어 있습니다.');
      return res.status(400).json({
        success: false,
        errMessage: '이미 존재하는 이메일입니다.',
      }); //만약에 입력한 이메일이 db에 있다면(이메일을 db에서 불어와야 하니까, 비동기 방식을 적용) 콘솔로그 찍어주고, 400에러(콘솔로그, 클라이언트단에 메세지 보내주기!)
    }
    // userNickname 중복 여부
    if (await checkUserNicknameValidation(userNickname)) {
      console.log('닉네임이 중복 되어 있습니다.');
      return res.status(400).json({
        success: false,
        errMessage: '이미 존재하는 닉네임입니다.',
      });// 만약에, db에 존재하는 닉네임이 있다면(닉네임을 db에서 불러와야 하니까, 비동기 방식) 400에러 응답 
    }

    // 비밀번호 암호화(암호화)
    const salt = bcrypt.genSaltSync(setRounds); //salt값 생성; 비밀번호를 암호화 하기 전에 랜덤한 값을 더하여 결과 값을 무작위로 만들어 줌(동일한 패스워드를 입력하더라도, 생성값은 항상 달라짐)
    const hashedPassword = bcrypt.hashSync(userPw, salt);
    //bcrypt해쉬 함수에 패스워드와 *salt(숫자) 를넣어서 암호화된 패스워드를 생성 
    const userParams = [userEmail, hashedPassword, userNickname];
    //userParams에 유저 이메일, 패스워드, 닉네임을 배열로 저장
    const userQuery =
      'INSERT INTO user(userEmail, userPw, userNickname) VALUES(?,?,?)';
    //유저 이메일과 비밀번호와 닉네임을 유저라는 db카테고리에 저장 하겠다
    // user 생성
    ///****
    await db.query(userQuery, userParams, async (error, rows, fields) => {
      if (error) {
        console.log(`Msg: raise Error in createUser => ${error}`);
        return res.status(400).json({
          success: false,
        });
      } 
      //쿼리 문이 실행되고 나서 실행되는 콜백 함수의 인자는 rows에서 행의 정보가 담겨있는 배열!
      //fields에는 컬럼에 관련된 정보가 담겨 있음
      const userId = rows.insertId; //insertId 란 무엇인가?; db에 입력될때 생성된느 auto_increment값! 콘솔로그 userId 찍어보기
      const profileParams = [userId]; //*이렇게 괄호를 친 이유는 무엇일까? 배열로 인자를 넣어줘야 하기때문에!
      const profileQuery = 'INSERT INTO profile(userId) VALUES(?)'; //userid를 저장 set ? 객체로 받아야 하고, valuse? 배열로 받아야 한다!
      //db저장중, 오류가 난다면, 400 에러 코드를 보내줌!
      //그게 아니라면, rows라는 객체 안에 있는 auto_increment값은 userid가 되고, 다시 그 값이,  profileParams  변수에 저장



      // profile 생성
      await db.query(profileQuery, profileParams, (error, rows, fields) => {
        if (error) {
          console.log(`Msg: raise Error in createProfile => ${error}`);
          return res.status(400).json({
            success: false,
          });
        }
      });// 쿼리문으로 디비에 데이터를 저장 만약에 에러가 생겼다면, 400에러 코드 보내주고,
      console.log(`${userEmail}로 회원 등록이 완료되었습니다.`);

      return res.status(201).json({
        success: true,
      });
    });
  } catch (err) {
    console.log('회원가입 기능 중 발생한 에러: ', err);
    return res.status(500).json({
      success: false,
    });
  }
});

// 이메일 중복 여부
function checkUserEmailValidation(userEmail) {
  return new Promise((resolve, reject) => {
    const query = 'select * from user where userEmail = ?'; //유저 이메일에 관련된 정보 소환
    const params = [userEmail]; //파람스는 배열로 가져와야 함
    db.query(query, params, (error, rows, fields) => {
      if (error) {
        console.log(`Msg: raise Error in checkValidationEmail => ${error}`);
        return resolve(true);
      }

      // 아무 값이 없기 때문에, 중복이 없다. (가능 하다는 얘기)
      if (rows.length == 0) {
        return resolve(false);
      }

      // 존재하다면, 이메일 중복으로 인지
      resolve(true);
    });
  });
}

// 이메일 정규식 체크
function emailFormCheckCheck(userEmail) {
  const reg_name =
    /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i; // 이메일 정규식표현
  if (reg_name.test(userEmail)) {
    //정규식 검사
    return true;
  }
  return false;
}

// 닉네임 중복 여부
function checkUserNicknameValidation(userNickname) {
  return new Promise((resolve, reject) => {
    const query = 'select * from user where userNickname = ?'; //userNickname에 관련된 정보를 가져옴
    const params = [userNickname]; 
    db.query(query, params, (error, rows, fields) => {
      if (error) {
        console.log(`Msg: raise Error in checkValidationNickname => ${error}`);
        return resolve(true);
      }

      // 아무 값이 없기 때문에, 중복이 없다. (가능 하다는 얘기)
      if (rows.length == 0) {
        return resolve(false);
      }
      // 존재하다면, 닉네임 중복으로 인지
      resolve(true);
    });
  });
}

// 비밀번호 일치 여부 알려주는 함수
function checkMatchingPassword(userPw, userPwCheck) {
  if (userPw === userPwCheck) {
    return true;
  }
  return false;
}

// login
router.post('/auth', async (req, res) => {
  //post method 사용, /users/auth라는 경로를 통해, 요청, 응답 객체를 가지고 비동기식 api
  try {
    const { userEmail, userPw } = req.body;

    const data = await isMatchEmailToPwd(userEmail, userPw);
    console.log(data);
    // 로그인 정보가 일치하지 않을 경우
    if (!data.success) {
      return res.status(401).json({
        success: false,
      });
    }

    // DB에서 nickname, email을 가져온다. 토큰에 넣기 위함.
    const nickname = data.rows.userNickname;
    const email = data.rows.userEmail;
    const id = data.rows.userId;
    const hashedPw = data.rows.userPw;

    // 비밀번호가 일치하지 않는 경우(Unauthorized)
    if (!bcrypt.compareSync(userPw, hashedPw)) {
      console.log('비밀번호가 일치하지 않는 경우에 걸림');
      return res.status(401).json({
        success: false,
      });
    }

    // 토큰 생성
    const token = createJwtToken(nickname, email);
    res.status(201).json({
      success: true,
      token,
      userEmail: email,
      userNickname: nickname,
      userId: id,
    });

  } catch (err) {
    console.log('로그인 기능 중 에러가 발생: ', err);
    res.status(500).json({
      success: false,
    });
  }
});

//JWT 토큰 생성
function createJwtToken(userNickname, userEmail) {
  return jwt.sign({ userNickname, userEmail }, process.env.SECRET_KEY, {
    expiresIn: '24h',
  });
}

const isMatchEmailToPwd = (userEmail, userPw) => {
  return new Promise((resolve, reject) => {
    const params = [userEmail];
    const query = 'select * from user where userEmail= ?'; // userEmail를 통해서 해당 유저 데이터를 가져온다.

    db.query(query, params, (error, rows, fields) => {
      if (error) {
        console.error(`Msg: raise Error in isMatchEmailToPwd => ${error}`);
        return resolve({ success: false });
      }
      // query문의 결과가 1개 이상이면서 비밀번호가 일치할 때,
      if (rows.length >= 1 && bcrypt.compareSync(userPw, rows[0].userPw)) {
        return resolve({
          success: true,
          rows: rows[0], //콘솔로그 찍어보고 싶네!
        });
        console.log(rows)
      }
      return resolve({ success: false });
    });
  });
};

// 유저페이지 불러오기
router.get('/:userNickname', async (req, res) => {
  try {
    let userNickname = req.params.userNickname;
    userNickname = userNickname.split('@')[1];
    const postQuery = `select postId, postImage, postTitle, postIntro, postTime, (select count(*) from comment where postId=post.postId) as commentCnt from post where userNickname="${userNickname}";`;
    //postId, postImage, postTitle, postIntro, postTime 그리고, 해당 포스트 아이디의 코멘트 모든 행의 수를 센다
    await db.query(postQuery, async (err, posts) => {
      if (err) {
        console.log(' 유저 페이지 postQuery문 실행 중 발생한 에러: ', err);
        return res.status(400).json({
          success: false,
        });
      }
      try {
        const userQuery = `select user.userId, user.userEmail, user.userNickname, profile.userImage, profile.userIntro from user inner join profile on user.userId = profile.userId where user.userNickname="${userNickname}";`;
        //user.userNickname 과 userNickname이 동일 하다면, user에서 userId, userEmail, userNickname, profile에서 userImage, userIntro 를 유저의 inner join profile 에서 user.userid 와 profile.userId와 동일한것
        //물어보자!
        await db.query(userQuery, async (err, user) => {
          if (err) {
            console.log('유저 페이지  userQuery문 실행 중 발생한 에러: ', err);
            return res.status(400).json({
              success: false,
            });
          }

          return res.status(200).json({
            success: true,
            posts,
            user,
          });
        });
      } catch (err) {
        console.log('유저 페이지 userQuery문 실행 중 발생한 에러:', err);
        return res.status(400).json({
          success: false,
        });
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
    });
  }
});

module.exports = router;
