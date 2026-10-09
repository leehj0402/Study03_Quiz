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
  world_geography: [
    {
      id: 'wg-01',
      question: '2026년 기준 국토 면적이 세계에서 가장 넓은 나라는? (면적 2위 나라의 거의 두 배다)',
      choices: ['러시아', '캐나다', '중국', '미국'],
      answerIndex: 0,
      explanation: '러시아는 면적 2위인 캐나다의 거의 두 배 넓이로, 북아시아 전체와 유럽 동부 3분의 1에 걸쳐 11개 시간대를 지난다.',
      source: {
        name: 'Encyclopaedia Britannica, "Russia"',
        url: 'https://www.britannica.com/place/Russia',
        checkedOn: '2026-10-10'
      }
    },
    {
      id: 'wg-02',
      question: '시베리아 남동부에 있고 깊이가 약 1,700m로 지구 담수의 약 20%를 담고 있는 호수는?',
      choices: ['바이칼호', '카스피해', '빅토리아호', '탕가니카호'],
      answerIndex: 0,
      explanation: '바이칼호는 약 2,500만 년 전에 생긴 호수로, 깊이 약 1,700m에 지구 전체 미결빙 담수의 20%를 담고 있다.',
      source: {
        name: 'UNESCO World Heritage Centre, "Lake Baikal"',
        url: 'https://whc.unesco.org/en/list/754/',
        checkedOn: '2026-10-10'
      }
    },
    {
      id: 'wg-03',
      question: '네팔의 사가르마타 국립공원이 품고 있는, 2026년 기준 해발 8,848m의 세계 최고봉은?',
      choices: ['에베레스트', 'K2', '칸첸중가', '안나푸르나'],
      answerIndex: 0,
      explanation: '사가르마타 국립공원은 해발 8,848m의 에베레스트가 중심인 지역으로, 눈표범과 레서판다 같은 희귀종이 산다.',
      source: {
        name: 'UNESCO World Heritage Centre, "Sagarmatha National Park"',
        url: 'https://whc.unesco.org/en/list/120/',
        checkedOn: '2026-10-10'
      }
    },
    {
      id: 'wg-04',
      question: '현지 이름 모시오아툰야로도 불리는 빅토리아 폭포가 걸쳐 있는 두 나라는?',
      choices: ['잠비아와 짐바브웨', '케냐와 탄자니아', '앙골라와 나미비아', '모잠비크와 말라위'],
      answerIndex: 0,
      explanation: '빅토리아 폭포 세계유산은 잠비아의 모시오아툰야 국립공원과 짐바브웨의 빅토리아 폭포 국립공원에 걸친 초국경 유산이다.',
      source: {
        name: 'UNESCO World Heritage Centre, "Mosi-oa-Tunya / Victoria Falls"',
        url: 'https://whc.unesco.org/en/list/509/',
        checkedOn: '2026-10-10'
      }
    },
    {
      id: 'wg-05',
      question: '남아메리카 서쪽 해안을 따라 남북으로 긴 나라 칠레의 수도는?',
      choices: ['산티아고', '발파라이소', '리마', '부에노스아이레스'],
      answerIndex: 0,
      explanation: '칠레의 수도는 나라 중앙 계곡에 있는 산티아고다. 발파라이소는 의회가 있는 항구 도시다.',
      source: {
        name: 'Encyclopaedia Britannica, "Chile"',
        url: 'https://www.britannica.com/place/Chile',
        checkedOn: '2026-10-10'
      }
    },
    {
      id: 'wg-06',
      question: '약 17,500개의 섬으로 이루어진 동남아시아 국가는?',
      choices: ['인도네시아', '필리핀', '말레이시아', '파푸아뉴기니'],
      answerIndex: 0,
      explanation: '인도네시아는 약 17,500개의 섬으로 이루어져 있고, 그 가운데 7,000개가 넘는 섬에는 사람이 살지 않는다.',
      source: {
        name: 'Encyclopaedia Britannica, "Indonesia"',
        url: 'https://www.britannica.com/place/Indonesia',
        checkedOn: '2026-10-10'
      }
    },
    {
      id: 'wg-07',
      question: '북대서양에 있고 덴마크 왕국에 속하는, 2026년 기준 세계에서 가장 큰 섬은?',
      choices: ['그린란드', '뉴기니섬', '보르네오섬', '마다가스카르섬'],
      answerIndex: 0,
      explanation: '그린란드는 세계에서 가장 큰 섬으로, 덴마크 왕국에 속하면서 자치정부를 두고 있다.',
      source: {
        name: 'Encyclopaedia Britannica, "Greenland"',
        url: 'https://www.britannica.com/place/Greenland',
        checkedOn: '2026-10-10'
      }
    },
    {
      id: 'wg-08',
      question: '요르단강이 흘러드는 곳이자, 지구 지표면에서 수면이 가장 낮은 호수는?',
      choices: ['사해', '카스피해', '아랄해', '투르카나호'],
      answerIndex: 0,
      explanation: '사해는 지구 지표면에서 수면 높이가 가장 낮은 호수이며, 물은 거의 전부 북쪽에서 흘러드는 요르단강에서 온다.',
      source: {
        name: 'Encyclopaedia Britannica, "Dead Sea"',
        url: 'https://www.britannica.com/place/Dead-Sea',
        checkedOn: '2026-10-10'
      }
    },
    {
      id: 'wg-09',
      question: '세계에서 가장 큰 산호초 군락인 그레이트배리어리프가 있는 나라는?',
      choices: ['오스트레일리아', '인도네시아', '멕시코', '이집트'],
      answerIndex: 0,
      explanation: '그레이트배리어리프는 오스트레일리아 북동 해안에 있으며, 산호 400종과 어류 1,500종이 사는 세계 최대 산호초 군락이다.',
      source: {
        name: 'UNESCO World Heritage Centre, "Great Barrier Reef"',
        url: 'https://whc.unesco.org/en/list/154/',
        checkedOn: '2026-10-10'
      }
    },
    {
      id: 'wg-10',
      question: '적도 남쪽에서 시작해 아프리카 북동부를 북쪽으로 흐르는 나일강이 흘러드는 바다는?',
      choices: ['지중해', '홍해', '아라비아해', '흑해'],
      answerIndex: 0,
      explanation: '나일강은 적도 남쪽에서 시작해 북쪽으로 약 6,650km를 흘러 지중해로 들어간다.',
      source: {
        name: 'Encyclopaedia Britannica, "Nile River"',
        url: 'https://www.britannica.com/place/Nile-River',
        checkedOn: '2026-10-10'
      }
    }
  ],
  science: [],
  arts_culture: []
};
