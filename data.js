/*
 * 점심 운동 앱 데이터
 * 루틴·타임라인·시설 정보를 바꾸려면 이 파일만 고치면 됩니다.
 * - 운동 id는 기록과 그래프를 잇는 열쇠이므로, 이름만 바꿀 때는 id를 그대로 두세요.
 * - rest: 휴식 시간(초), load: 중량 입력칸 표시 여부, rpe: null이면 RPE 칸을 숨김
 */
window.DATA = {
  // 요일(0=일 … 6=토) → 운동 키. 없는 요일은 휴식
  schedule: { 1: "A", 2: "S1", 3: "B", 4: "S2", 5: "C" },

  cycleWeeks: 4,

  // 운동 이름을 누르면 유튜브에서 "이름 + videoSuffix"로 검색합니다.
  // 운동·수영 블록마다 video: "검색어"를 적으면 그 검색어를 대신 씁니다.
  videoSuffix: "자세",

  timeline: {
    weight: [
      { start: "10:30", end: "10:40", label: "간식", detail: "바나나·요거트 등" },
      { start: "11:30", end: "11:45", label: "이동·탈의", detail: "도보 약 10분" },
      { start: "11:45", end: "12:35", label: "웨이트", detail: "50분(워밍업 5분 포함)", main: true },
      { start: "12:35", end: "12:50", label: "샤워" },
      { start: "12:50", end: "13:00", label: "복귀·간편식", detail: "단백질 위주" }
    ],
    swim: [
      { start: "10:30", end: "10:40", label: "간식", detail: "바나나·요거트 등" },
      { start: "11:30", end: "11:50", label: "이동·탈의·샤워", detail: "입수 전 샤워" },
      { start: "11:50", end: "12:30", label: "수영", detail: "40분", main: true },
      { start: "12:30", end: "12:50", label: "샤워·건조", detail: "머리 말리기" },
      { start: "12:50", end: "13:00", label: "복귀", detail: "단백질 위주 간편식" }
    ]
  },

  workouts: {
    A: {
      name: "웨이트 A", type: "weight", focus: "하체, 후면 사슬, 코어",
      exercises: [
        { id: "squat", name: "백스쿼트", sets: 4, reps: "5", rpe: "7~8", rest: 150, load: true,
          cue: "모든 렙에서 똑같이 브레이싱, 골반 중립" },
        { id: "rdl", name: "루마니안 데드리프트", sets: 3, reps: "8", rpe: "7", rest: 120, load: true,
          cue: "힙 힌지, 허리 중립" },
        { id: "bss", name: "불가리안 스플릿 스쿼트", sets: 2, reps: "8(한쪽씩)", rpe: "7", rest: 90, load: true,
          cue: "좌우 불균형 점검" },
        { id: "deadbug", video: "데드버그 사이드 플랭크", name: "데드버그 + 사이드 플랭크", sets: 3, reps: "10회 / 30초", rpe: null, rest: 60, load: false,
          unit: "라운드", cue: "갈비뼈가 뜨지 않게, 호흡 조절" }
      ]
    },
    B: {
      name: "웨이트 B", type: "weight", focus: "상체 당기기 우선, 견갑 안정화",
      exercises: [
        { id: "bench", name: "벤치프레스", sets: 3, reps: "6", rpe: "7", rest: 120, load: true,
          cue: "견갑을 모으고 내린 채 고정" },
        { id: "csrow", name: "체스트 서포티드 로우", sets: 4, reps: "8", rpe: "7~8", rest: 90, load: true,
          cue: "등 중간 수축, 라운드숄더 교정" },
        { id: "pullup", video: "풀업 랫풀다운 자세", name: "풀업 또는 랫풀다운", sets: 3, reps: "8", rpe: "7", rest: 90, load: true,
          cue: "어깨를 으쓱하지 않기" },
        { id: "facepull", video: "페이스풀 밴드 풀어파트", name: "페이스풀 + 밴드 풀어파트", sets: 3, reps: "15 / 20", rpe: null, rest: 45, load: true,
          cue: "어깨 바깥 회전, 하부 승모근" }
      ]
    },
    C: {
      name: "웨이트 C", type: "weight", focus: "힙힌지, 한쪽씩 하는 동작, 들고 걷기",
      exercises: [
        { id: "deadlift", video: "데드리프트 자세", name: "데드리프트(트랩바 가능)", sets: 4, reps: "4", rpe: "7~8", rest: 150, load: true,
          cue: "들기 전 랫을 당겨 긴장 만들기" },
        { id: "landmine", video: "랜드마인 프레스 자세", name: "랜드마인 프레스 또는 푸시업", sets: 3, reps: "10", rpe: "7", rest: 90, load: true,
          cue: "어깨에 부담이 적은 밀기 동작" },
        { id: "dbrow", name: "원암 덤벨 로우", sets: 3, reps: "10(한쪽씩)", rpe: "7", rest: 60, load: true,
          cue: "몸통이 돌아가지 않게" },
        { id: "carry", video: "파머스 캐리 팔로프 프레스", name: "파머스 캐리 + 팔로프 프레스", sets: 3, reps: "30m / 10회", rpe: null, rest: 60, load: true,
          cue: "바른 자세 유지, 몸통 회전 버티기" }
      ]
    },
    S1: {
      name: "수영 1", type: "swim", focus: "유산소·역치(CSS)", approx: "약 2,300m",
      blocks: [
        { id: "wu", name: "워밍업", reps: 1, dist: 400, video: "수영 워밍업 루틴", rest: 0, detail: "자유형·배영 섞어서 여유 있게" },
        { id: "drill", name: "드릴", reps: 4, dist: 50, video: "자유형 드릴", rest: 10, detail: "25m 드릴 + 25m 스윔" },
        { id: "main", name: "메인", reps: 12, dist: 100, video: "수영 CSS 훈련 페이스", rest: 10, main: true, css: true,
          detail: "자유형 CSS 페이스. 4개마다 페이스 점검, 끝까지 일정하게" },
        { id: "speed", name: "스피드", reps: 4, dist: 25, video: "자유형 스프린트 훈련", rest: 30, detail: "전력" },
        { id: "cd", name: "쿨다운", reps: 1, dist: 200, video: "수영 쿨다운", rest: 0, detail: "천천히" }
      ]
    },
    S2: {
      name: "수영 2", type: "swim", focus: "기술·스피드·개인혼영", approx: "약 2,000m",
      note: "금요일 데드리프트가 있으니 고강도는 피하기",
      blocks: [
        { id: "wu", name: "워밍업", reps: 1, dist: 500, video: "수영 킥 훈련", rest: 0, detail: "자유형 300m + 킥 200m" },
        { id: "drill", name: "드릴", reps: 8, dist: 50, video: "개인혼영 드릴", rest: 0, detail: "개인혼영 순서(영법마다 2개, 25m 드릴 + 25m 스윔)" },
        { id: "main", name: "메인", reps: 6, dist: 100, video: "개인혼영 턴 스트림라인", rest: 15, main: true,
          detail: "개인혼영. 1~3번 점점 빠르게, 4~6번 일정하게. 턴·스트림라인 집중" },
        { id: "pull", name: "풀", reps: 1, dist: 200, video: "풀부이 수영 훈련", rest: 0, detail: "풀부이로 스트로크 수 줄이기" },
        { id: "cd", name: "쿨다운", reps: 1, dist: 100, video: "배영 자세", rest: 0, detail: "배영" }
      ]
    }
  },

  // 4주 주기. rpe: 해당 주 RPE(RPE가 있는 운동에만 적용)
  // setDelta: 세트 증감, volumeFactor: 세트 배율, loadIncrease: 중량 증가 범위(%)
  // swimPct: 메인 세트 양(%), cssDelta: CSS 페이스 변화(초/100m)
  weeks: [
    { week: 1, label: "적응", rpe: "6~7", setDelta: -1, swimPct: 80,
      note: "동선과 시간표에 적응. 세트를 하나씩 줄이고 수영 메인 세트는 80%" },
    { week: 2, label: "기준 설정", rpe: "7", swimPct: 100,
      note: "기준 중량과 CSS 페이스를 기록" },
    { week: 3, label: "점진적 과부하", rpe: "7~8", loadIncrease: [2.5, 5], swimPct: 100, cssDelta: -1,
      note: "중량 2.5~5% 증가, CSS 페이스 1초 단축" },
    { week: 4, label: "디로드", rpe: "6", volumeFactor: 0.6, swimPct: 70, swimFocus: "기술 위주",
      note: "볼륨 -40%, RPE 6. 수영은 기술 위주 70%. 회복과 자세 재평가" }
  ],

  facility: {
    name: "정부세종청사체육관",
    address: "세종 도움8로 11-10",
    tel: "044-865-4066",
    hours: "평일 06~22시",
    info: [
      "수영 일일권 4,000원",
      "공무원 할인 약 30%(일일권 적용 여부 확인 필요)",
      "헬스장과 수영장이 같은 건물, 샤워실 공용",
      "청사에서 도보 약 10분"
    ]
  },

  todos: [
    "점심 자유수영 시간표",
    "헬스 월 회비",
    "회원 모집 일정",
    "프리웨이트 랙 수",
    "문화비 소득공제 등록 여부"
  ],

  gear: [
    "실내화",
    "리프팅 벨트",
    "수영복",
    "수모",
    "수경",
    "빨리 마르는 타월",
    "세면도구",
    "방수 파우치",
    "간식·간편식"
  ]
};
