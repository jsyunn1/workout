/*
 * 점심 운동 앱 데이터
 * 루틴·타임라인·시설 정보를 바꾸려면 이 파일만 고치면 됩니다.
 * - 운동 id는 기록과 그래프를 잇는 열쇠이므로, 이름만 바꿀 때는 id를 그대로 두세요.
 * - rest: 휴식 시간(초), load: 중량 입력칸 표시 여부, rpe: null이면 RPE 칸을 숨김
 */
window.DATA = {
  // 요일(0=일 … 6=토) → 운동 키. 없는 요일은 휴식
  // "W"는 웨이트 날: rotation 순서대로 돌아가며 배정됩니다(월 앞쪽 → 수 뒤쪽 → 금 앞쪽 → 다음 주 월 뒤쪽 …).
  schedule: { 1: "W", 2: "S1", 3: "W", 4: "S2", 5: "W" },
  rotation: ["FRONT", "BACK"],
  // 시작일을 정하지 않았을 때 교대 순서의 기준이 되는 월요일
  rotationStart: "2026-11-23",

  // 예상 소요 시간 계산: 세트당 동작 시간(초, 운동별 work로 바꿀 수 있음), 워밍업·이동 시간(분)
  setWorkSec: 45,
  warmupMin: 5,
  changeMin: 1,

  cycleWeeks: 4,

  // 운동 이름을 누르면 유튜브에서 "이름 + videoSuffix"로 검색합니다.
  // 운동·수영 블록마다 video: "검색어"를 적으면 그 검색어를 대신 씁니다.
  videoSuffix: "자세",

  timeline: {
    weight: [
      { start: "10:30", end: "10:40", label: "간식", detail: "바나나·요거트 등" },
      { start: "11:30", end: "11:45", label: "이동·탈의", detail: "도보 약 10분" },
      { start: "11:45", end: "12:25", label: "웨이트", detail: "30~40분(워밍업 5분 포함)", main: true },
      { start: "12:25", end: "12:45", label: "샤워" },
      { start: "12:45", end: "13:00", label: "복귀·간편식", detail: "단백질 위주" }
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
    FRONT: {
      name: "웨이트 앞쪽", type: "weight", focus: "몸 앞쪽: 허벅지, 가슴, 이두, 복근",
      exercises: [
        { id: "squat", name: "백스쿼트", target: "허벅지", sets: 4, reps: "6", rpe: "7~8", rest: 80, load: true,
          cue: "모든 렙에서 브레이싱, 무릎은 발끝 방향" },
        { id: "bench", name: "벤치프레스", target: "가슴", sets: 3, reps: "8", rpe: "7", rest: 80, load: true,
          cue: "견갑을 모으고 내린 채 고정" },
        { id: "lunge", name: "덤벨 리버스 런지", target: "허벅지", sets: 3, reps: "8(한쪽씩)", rpe: "7", rest: 40, load: true, work: 70,
          cue: "앞 무릎이 안으로 무너지지 않게, 상체 곧게" },
        { id: "curl", name: "덤벨 컬", target: "이두", sets: 3, reps: "12", rpe: "7", rest: 40, load: true,
          cue: "팔꿈치를 옆구리에 고정, 반동 없이" },
        { id: "kneeraise", name: "행잉 니레이즈", target: "복근", sets: 3, reps: "12", rpe: null, rest: 40, load: false,
          video: "행잉 니레이즈 자세", cue: "골반을 말아 올리고, 다리를 흔들지 않기" }
      ]
    },
    BACK: {
      name: "웨이트 뒤쪽", type: "weight", focus: "몸 뒤쪽: 허리·힙, 등, 삼두",
      exercises: [
        { id: "rdl", name: "루마니안 데드리프트", target: "허리·힙", sets: 4, reps: "6", rpe: "7~8", rest: 80, load: true,
          cue: "힙 힌지, 허리 중립" },
        { id: "csrow", name: "체스트 서포티드 로우", target: "등", sets: 3, reps: "10", rpe: "7", rest: 80, load: true,
          cue: "등 중간 수축, 라운드숄더 교정" },
        { id: "pullup", name: "랫풀다운 또는 풀업", target: "등", sets: 3, reps: "10", rpe: "7", rest: 40, load: true,
          video: "랫풀다운 자세", cue: "어깨를 으쓱하지 않기" },
        { id: "hipthrust", name: "힙 쓰러스트", target: "힙", sets: 3, reps: "10", rpe: "7", rest: 40, load: true,
          cue: "턱 당기고 갈비뼈 내린 채 엉덩이로 밀기" },
        { id: "pushdown", name: "케이블 푸시다운", target: "삼두", sets: 3, reps: "12", rpe: "7", rest: 40, load: true,
          cue: "팔꿈치 고정, 끝에서 1초 수축" }
      ]
    },
    S1: {
      name: "수영 1", type: "swim", focus: "유산소·역치(CSS) + 배영·평영", approx: "약 1,500m",
      blocks: [
        { id: "wu", name: "워밍업", reps: 1, dist: 300, video: "수영 워밍업 루틴", rest: 0,
          detail: "자유형 100m + 배영 100m + 평영 100m, 여유 있게" },
        { id: "drill", name: "드릴", reps: 4, dist: 50, video: "접영 배영 평영 드릴", rest: 10,
          detail: "접영·배영·평영·자유형 1개씩(25m 드릴 + 25m 스윔)" },
        { id: "main", name: "메인 1 · 자유형", reps: 4, dist: 100, video: "수영 CSS 훈련 페이스", rest: 10, main: true, css: true,
          detail: "자유형 CSS 페이스. 끝까지 일정하게" },
        { id: "main2", name: "메인 2 · 배영/평영", reps: 4, dist: 100, video: "배영 평영 자세", rest: 15, main: true,
          detail: "홀수는 배영, 짝수는 평영. 일정한 페이스로" },
        { id: "speed", name: "스피드", reps: 4, dist: 25, video: "영법별 스프린트 훈련", rest: 30,
          detail: "접영·배영·평영·자유형 순서로 전력" },
        { id: "cd", name: "쿨다운", reps: 1, dist: 100, video: "수영 쿨다운", rest: 0, detail: "배영·평영 섞어서 천천히" }
      ]
    },
    S2: {
      name: "수영 2", type: "swim", focus: "기술·스피드·개인혼영", approx: "약 1,200m",
      note: "다음 날 웨이트가 있으니 고강도는 피하기",
      blocks: [
        { id: "wu", name: "워밍업", reps: 1, dist: 300, video: "평영 킥 훈련", rest: 0,
          detail: "자유형 100m + 평영 킥(킥판) 100m + 배영 100m" },
        { id: "drill", name: "드릴", reps: 4, dist: 50, video: "개인혼영 드릴", rest: 0, detail: "개인혼영 순서(영법마다 1개, 25m 드릴 + 25m 스윔)" },
        { id: "main", name: "메인", reps: 4, dist: 100, video: "개인혼영 턴 스트림라인", rest: 15, main: true,
          detail: "개인혼영. 1~2번 점점 빠르게, 3~4번 일정하게. 턴·스트림라인 집중" },
        { id: "pull", name: "접영·평영", reps: 1, dist: 200, video: "한팔 접영 드릴", rest: 0,
          detail: "한팔 접영 드릴 4×25m + 평영 100m(스트로크 수 줄이기)" },
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
