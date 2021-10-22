/**
 * @swagger
 * /users/signup:
 *   post:
 *     tags:
 *      - User
 *     summary: 회원 등록(사용 가능)
 *     parameters:
 *       - name: body
 *         in: body
 *         schema:
 *           type: object
 *           properties:
 *            userEmail:
 *              type: string
 *              description: 유저 이메일
 *            userNickname:
 *              type: string
 *              description: 유저 닉네임
 *            userPw:
 *              type: string
 *              description: 유저 비밀번호
 *            userPwCheck:
 *              type: string
 *              description: 유저 비밀번호 확인
 *           example:
 *             userEmail: "najongsi@gmail.com"
 *             userNickname: "developerwan"
 *             userPw: "asdasd"
 *             userPwCheck: "asdasd"
 *     responses:
 *       '201':
 *         description: 회원 등록 성공!(Created)
 *       '400':
 *         description: 아이디 혹은 닉네임 중복이 있을 경우, 비밀번호가 일치하지 않는 경우 발생하는 에러
 *       '500':
 *         description: 회원가입시 발생한 예상하지 못한 에러(Internal Server Error)
 * /users/auth:
 *   post:
 *     tags:
 *       - User
 *     summary: 로그인 기능(사용 가능)
 *     parameters:
 *       - name: body
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             userEmail:
 *               type: string
 *               description: 유저 이메일
 *             userPw:
 *               type: string
 *               description: 유저 비밀번호
 *           example:
 *             userEmail: "najongsi@nate.com"
 *             userPw: "asdasd"
 *     responses:
 *       '201':
 *         description: 로그인 성공!
 *       '401':
 *         description: 아이디 또는 패스워드 불일치
 *       '500':
 *         description: 로그인 기능 중, 서버 측에서 예상치 못한 에러 발생
 */
