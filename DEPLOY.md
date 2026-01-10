# 배포 가이드 (Vercel & GitHub)

이 가이드는 프로젝트를 GitHub에 올리고 Vercel을 통해 배포하는 전체 과정을 설명합니다.

## 0. 준비 사항 (필수: Git 설치)
아래 오류(`git : ... 인식되지 않습니다`)가 나온다면 **Git**이 설치되어 있지 않은 것입니다.

1.  **[Git for Windows 다운로드](https://git-scm.com/download/win)** 링크를 클릭하세요.
2.  **"64-bit Git for Windows Setup"**을 클릭하여 다운로드하고 설치합니다. (설치 중 설정은 모두 'Next'만 누르면 됩니다)
3.  **설치가 끝나면 반드시 VS Code를 완전히 껐다가 다시 켜주세요.** (그래야 설치된 Git을 인식합니다)

## 1. GitHub 저장소 연결

두 가지 방법 중 하나를 선택하세요.

### 방법 A: 웹사이트에서 직접 업로드 (Git 설치 불필요, 추천)
명령어가 어렵거나 오류가 난다면 이 방법이 가장 빠릅니다.

1.  GitHub 저장소 페이지(`https://github.com/tovedu/tov-wrong-answer-check`)로 이동합니다.
2.  **Add file** 버튼을 누르고 **Upload files**를 선택합니다.
3.  내 컴퓨터의 프로젝트 폴더를 엽니다.
4.  **★중요★: `node_modules` 폴더와 `.next` 폴더는 절대 업로드하면 안 됩니다!**
    *   폴더 안의 **모든 파일을 선택(Ctrl+A)** 한 뒤, `node_modules`, `.next`, `.git` 폴더를 **체크 해제(Ctrl+클릭)** 하세요.
5.  선택된 파일들을 브라우저 화면으로 **드래그 앤 드롭** 합니다.
6.  업로드가 끝나면 아래 메시지 칸에 "first commit"이라고 쓰고 초록색 **Commit changes** 버튼을 누릅니다.

---

### 방법 B: 터미널 명령어 사용 (정석)
Git이 설치되어 있고 터미널 사용이 가능하다면 이 방법을 쓰세요.

**주의**: 명령어 복사 시, ` ```bash ` 같은 기호는 복사하지 마시고 **진한 회색 박스 안의 영어 글자만** 복사해서 붙여넣으세요.

**VS Code 터미널**을 열고 (`Ctrl` + `` ` ``) 아래 명령어들을 한 줄씩 복사해서 실행하세요.

1.  **깃 초기화 (시작)**
    ```bash
    git init
    ```

2.  **모든 파일을 스테이징 (준비)**
    ```bash
    git add .
    ```

3.  **변경 사항 저장 (커밋)**
    ```bash
    git commit -m "first commit"
    ```

4.  **브랜치 이름 변경 (main으로)**
    ```bash
    git branch -M main
    ```

5.  **내 저장소 주소 연결** (방금 만든 주소)
    ```bash
    git remote add origin https://github.com/tovedu/tov-wrong-answer-check.git
    ```

6.  **GitHub로 업로드 (푸시)**
    ```bash
    git push -u origin main
    ```

---

## 2. Vercel 프로젝트 생성 및 배포 (CLI 권장)

Vercel CLI를 사용하면 복잡한 웹 설정 없이 터미널에서 바로 배포할 수 있습니다.

### 2-1. Vercel CLI 설치
한 번만 설치하면 됩니다.
```bash
npm i -g vercel
```

### 2-2. Vercel 로그인 및 프로젝트 연결
```bash
vercel login
```
*   명령어를 치면 브라우저가 열립니다. GitHub 아이디로 로그인하세요.

### 2-3. 첫 배포 (Preview)
프로젝트 폴더에서 다음 명령어를 실행합니다.
```bash
vercel
```
*   질문이 나오면 대부분 `Enter`를 쳐서 기본값을 선택하면 됩니다.
    *   `Set up and deploy?` -> `y` (Enter)
    *   `Which scope?` -> (본인 계정 선택 후 Enter)
    *   `Link to existing project?` -> `n` (Enter)
    *   `Project name?` -> `tov-wrong-answer-check` (Enter)
    *   `In which directory?` -> `./` (Enter)
    *   `Want to modify settings?` -> `n` (Enter)

### 2. Google Apps Script (Backend) 설정
1. Google Drive에서 새 스프레드시트 생성.
2. `확장 프로그램` -> `Apps Script` 클릭.
3. **중요:** 프로젝트의 파일 목록에 있는 `Code.gs` (또는 `코드.gs`)의 내용을 모두 지우고, 이 프로젝트 폴더에 있는 `GAS_CODE.js`의 내용을 복사해서 붙여넣으세요.
4. `배포` -> `새 배포` 클릭.
   - 유형: `웹 앱`
   - 설명: `Initial Deploy`
   - 다음 사용자로서 실행: `나(웹 앱 소유자)`
   - 액세스 권한이 있는 사용자: `모든 사용자` (**필수**)
5. `배포` 클릭 후 권한 승인.
6. **웹 앱 URL**을 복사해두세요.

### 2-4. 환경 변수 설정
배포가 완료되면 Google Apps Script 주소를 Vercel에 알려줘야 합니다.
```bash
vercel env add GAS_WEBAPP_URL
```
*   `Enter the value:` 라는 질문에 아래 주소를 복사해서 붙여넣고 엔터를 치세요.
    `https://script.google.com/macros/s/AKfycbxSW7FHj-DpxQriEiaNTJsgFocFxFdVev1FyDmuZEcrBZSMPgEbiAbGN_yVGfpeS9P3/exec`
*   `Add to which environments?` -> `Production, Preview, Development` (모두 선택된 상태로 Enter)

### 2-5. 정식 배포 (Production)
환경 변수 설정 후, 실제 서비스용으로 다시 배포합니다.
```bash
vercel --prod
```
*   이 명령어가 끝나면 `Production: https://...` 주소가 나옵니다. 그 주소가 실제 사이트 주소입니다.

---

## 3. 웹사이트(Dashboard)에서 배포하는 방법 (참고용)

CLI가 어렵다면 Vercel 웹사이트에서도 가능합니다.

1.  **Vercel 프로젝트 생성**:
    - Vercel 대시보드에서 "Add New..." -> "Project" 클릭.
    - GitHub 저장소(`tov-wrong-answer-check`)를 Import 합니다.

2.  **환경 변수 설정**:
    - **Environment Variables** 섹션을 엽니다.
    - 다음 변수를 추가합니다:
        - Key: `GAS_WEBAPP_URL`
        - Value: `https://script.google.com/macros/s/AKfycbxSW7FHj-DpxQriEiaNTJsgFocFxFdVev1FyDmuZEcrBZSMPgEbiAbGN_yVGfpeS9P3/exec`

3.  **배포**:
    - "Deploy" 버튼을 클릭합니다.

## 주의사항
- Google Apps Script는 `doGet`, `doPost`가 구현되어 있어야 하며 `Web App`으로 배포(Everyone has access)되어 있어야 합니다.
- Next.js의 `app/api/gas/route.ts`가 프록시 역할을 하여 CORS 문제를 해결합니다.
