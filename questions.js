var QUESTIONS = {
  korean_history: [
    {
      id: 'kh-01',
      question: '훈민정음 해설서인 『훈민정음』(해례본)이 간행된 해는?',
      choices: ['1418년', '1443년', '1446년', '1450년'],
      answerIndex: 2,
      explanation: '1446년에 정인지·신숙주 등이 예의와 해례, 정인지 서문을 담아 간행했다. 1443년은 글자가 만들어진 때다.',
      source: {
        name: '한국학중앙연구원 한국민족문화대백과사전, 「훈민정음」',
        url: 'https://encykorea.aks.ac.kr/Article/E0065805',
        checkedOn: '2026-10-10'
      }
    },
    {
      id: 'kh-02',
      question: '발해가 세워져 멸망할 때까지 존속한 기간은?',
      choices: ['676년~935년', '698년~926년', '668년~918년', '918년~1392년'],
      answerIndex: 1,
      explanation: '발해는 698년에 세워져 926년에 멸망했다. 초기 국명은 진국(震國)이었다.',
      source: {
        name: '한국학중앙연구원 한국민족문화대백과사전, 「발해」',
        url: 'https://encykorea.aks.ac.kr/Article/E0021626',
        checkedOn: '2026-10-10'
      }
    },
    {
      id: 'kh-03',
      question: '1592년 한산도대첩에서 이순신이 모든 전선에 짜게 한 진형은?',
      choices: ['학익진', '어린진', '방원진', '장사진'],
      answerIndex: 0,
      explanation: '이순신은 좁은 견내량 대신 한산섬 앞바다로 일본 수군을 유인한 뒤, 모든 전선이 학익진을 짜서 공격하게 했다.',
      source: {
        name: '한국학중앙연구원 한국민족문화대백과사전, 「한산도대첩」',
        url: 'https://encykorea.aks.ac.kr/Article/E0061676',
        checkedOn: '2026-10-10'
      }
    },
    {
      id: 'kh-04',
      question: '1876년 조선과 일본 사이에 체결된 강화도조약의 정식 명칭은?',
      choices: ['조일수호조규', '조미수호통상조약', '제물포조약', '한일의정서'],
      answerIndex: 0,
      explanation: '강화도조약의 정식 명칭은 조일수호조규이며, 병자수호조약으로도 불린다. 1876년(고종 13) 강화부에서 체결된 불평등 조약이다.',
      source: {
        name: '한국학중앙연구원 한국민족문화대백과사전, 「강화도조약」',
        url: 'https://encykorea.aks.ac.kr/Article/E0001508',
        checkedOn: '2026-10-10'
      }
    },
    {
      id: 'kh-05',
      question: '1919년 4월 11일 대한민국임시정부가 수립된 도시는?',
      choices: ['중국 상하이', '중국 충칭', '러시아 블라디보스토크', '미국 하와이'],
      answerIndex: 0,
      explanation: '대한민국임시정부는 1919년 4월 11일 중국 상하이에서 수립됐다. 충칭은 뒷날 임시정부가 옮겨 간 곳이다.',
      source: {
        name: '한국학중앙연구원 한국민족문화대백과사전, 「대한민국 임시정부 수립 기념일」',
        url: 'https://encykorea.aks.ac.kr/Article/E0080590',
        checkedOn: '2026-10-10'
      }
    },
    {
      id: 'kh-06',
      question: '조선 세종 때 만들어진 측우기는 무엇을 재는 기구인가?',
      choices: ['비가 내린 양', '바람의 방향', '그림자로 재는 시각', '땅의 높낮이'],
      answerIndex: 0,
      explanation: '측우기는 금속제 원통형 그릇에 빗물을 받아 표준화된 자로 깊이를 재는 기구로, 현대의 우량계에 해당한다.',
      source: {
        name: '한국학중앙연구원 한국민족문화대백과사전, 「측우기」',
        url: 'https://encykorea.aks.ac.kr/Article/E0058337',
        checkedOn: '2026-10-10'
      }
    },
    {
      id: 'kh-07',
      question: '1861년 목판본 22첩으로 간행된 전국 지도첩 대동여지도를 만든 사람은?',
      choices: ['김정호', '정약용', '이중환', '신경준'],
      answerIndex: 0,
      explanation: '대동여지도는 1861년 김정호가 목판본으로 제작한 절첩분첩식 전국 지도첩이다.',
      source: {
        name: '한국학중앙연구원 한국민족문화대백과사전, 「대동여지도」',
        url: 'https://encykorea.aks.ac.kr/Article/E0014266',
        checkedOn: '2026-10-10'
      }
    },
    {
      id: 'kh-08',
      question: '3·1운동 때 민족대표들이 독립선언식을 거행한 서울 인사동의 장소는?',
      choices: ['태화관', '명월관', '국일관', '조선호텔'],
      answerIndex: 0,
      explanation: '1919년 3월 1일 민족대표 33인 중 29인이 서울 인사동 태화관에 모여 독립선언식을 하고 그 자리에서 연행됐다.',
      source: {
        name: '한국학중앙연구원 한국민족문화대백과사전, 「3·1운동」',
        url: 'https://encykorea.aks.ac.kr/Article/E0026772',
        checkedOn: '2026-10-10'
      }
    },
    {
      id: 'kh-09',
      question: '중국 지린성 집안시에 있는 광개토왕릉비를 414년에 세운 고구려 왕은?',
      choices: ['장수왕', '광개토왕', '소수림왕', '고국원왕'],
      answerIndex: 0,
      explanation: '광개토왕릉비는 414년(장수왕 3)에 장수왕이 아버지 광개토왕의 업적을 기리기 위해 세웠다.',
      source: {
        name: '한국학중앙연구원 한국민족문화대백과사전, 「광개토왕릉비」',
        url: 'https://encykorea.aks.ac.kr/Article/E0005058',
        checkedOn: '2026-10-10'
      }
    },
    {
      id: 'kh-10',
      question: '왕건이 고려를 세운 해는?',
      choices: ['892년', '918년', '936년', '1392년'],
      answerIndex: 1,
      explanation: '고려는 918년 개성 출신 왕건이 건국해 936년 후삼국을 통합하고 1392년까지 이어졌다.',
      source: {
        name: '한국학중앙연구원 한국민족문화대백과사전, 「고려」',
        url: 'https://encykorea.aks.ac.kr/Article/E0003424',
        checkedOn: '2026-10-10'
      }
    }
  ],
  world_geography: [],
  science: [],
  arts_culture: []
};
