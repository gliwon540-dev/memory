/* =====================================================
   SUPABASE 설정
===================================================== */

/*
  아래 두 값을 본인의 Supabase 프로젝트 값으로 바꿔주세요.

  Supabase Dashboard
  → Project Settings
  → API

  에서 확인할 수 있습니다.
*/

const SUPABASE_URL =
  "여기에_SUPABASE_URL";

const SUPABASE_KEY =
  "여기에_SUPABASE_PUBLISHABLE_KEY";


const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* =====================================================
   기본 변수
===================================================== */

let currentStep = 1;

let selectedEmotions = [];

let selectedCurrentFeelings = [];

let allMemories = [];

let currentCategory = "전체";


/* =====================================================
   화면 이동
===================================================== */

function scrollToSection(id) {

  document
    .getElementById(id)
    .scrollIntoView({
      behavior: "smooth"
    });

}


/* =====================================================
   기억 회상 단계
===================================================== */

function updateStep(step) {

  currentStep = step;


  document
    .querySelectorAll(".memory-step")
    .forEach(item => {

      item.classList.toggle(
        "active",
        Number(item.dataset.step) === step
      );

    });


  document.getElementById("progressText")
    .textContent = `${step} / 4`;


  const previousButton =
    document.getElementById("previousButton");

  const nextButton =
    document.getElementById("nextButton");

  const submitButton =
    document.getElementById("submitButton");


  previousButton.style.visibility =
    step === 1 ? "hidden" : "visible";


  nextButton.style.display =
    step === 4 ? "none" : "block";


  submitButton.style.display =
    step === 4 ? "block" : "none";

}


/* =====================================================
   이전
===================================================== */

document
  .getElementById("previousButton")
  .addEventListener("click", () => {

    if (currentStep > 1) {

      updateStep(currentStep - 1);

    }

  });


/* =====================================================
   다음
===================================================== */

document
  .getElementById("nextButton")
  .addEventListener("click", () => {

    if (currentStep === 1) {

      const memory =
        document
          .getElementById("memoryText")
          .value
          .trim();


      if (!memory) {

        alert("먼저 기억을 적어주세요.");

        return;

      }

    }


    updateStep(currentStep + 1);

  });


/* =====================================================
   선택 버튼
===================================================== */

document
  .querySelectorAll(".choice-list button")
  .forEach(button => {

    button.addEventListener("click", () => {

      button.classList.toggle("selected");

      const step =
        button.closest(".memory-step").dataset.step;


      if (step === "2") {

        selectedEmotions =
          [...document.querySelectorAll(
            '[data-step="2"] .selected'
          )]
          .map(button => button.textContent);

      }


      if (step === "3") {

        selectedCurrentFeelings =
          [...document.querySelectorAll(
            '[data-step="3"] .selected'
          )]
          .map(button => button.textContent);

      }

    });

  });


/* =====================================================
   기억 저장
===================================================== */

document
  .getElementById("submitButton")
  .addEventListener("click", async () => {

    const memory =
      document
        .getElementById("memoryText")
        .value
        .trim();


    const reflection =
      document
        .getElementById("reflectionText")
        .value
        .trim();


    if (!memory) {

      alert("기억을 적어주세요.");

      updateStep(1);

      return;

    }


    const submitButton =
      document.getElementById("submitButton");


    submitButton.disabled = true;

    submitButton.textContent =
      "저장하는 중...";


    /*
      실제 DB에 저장

      이름, 이메일, 전화번호 등은
      저장하지 않습니다.
    */

    const { data, error } =
      await supabaseClient
        .from("memories")
        .insert({

          memory: memory,

          emotions:
            selectedEmotions.join(", "),

          current_feeling:
            selectedCurrentFeelings.join(", "),

          reflection:
            reflection

        })
        .select()
        .single();


    submitButton.disabled = false;

    submitButton.textContent =
      "기억 남기기";


    if (error) {

      console.error(error);

      alert(
        "기억을 저장하지 못했습니다.\n\n" +
        "Supabase 설정을 확인해주세요."
      );

      return;

    }


    /*
      저장 성공
    */

    const message =
      document.getElementById("submitMessage");


    message.style.display = "block";


    message.innerHTML = `
      <strong>기억이 남겨졌어요.</strong><br>
      다른 사람들도 이 기억을 볼 수 있습니다.
    `;


    /*
      입력칸 초기화
    */

    document
      .getElementById("memoryText")
      .value = "";


    document
      .getElementById("reflectionText")
      .value = "";


    document
      .querySelectorAll(".choice-list button")
      .forEach(button => {

        button.classList.remove("selected");

      });


    selectedEmotions = [];

    selectedCurrentFeelings = [];


    updateStep(1);


    /*
      저장 후 OUR ARCHIVE로 이동
    */

    setTimeout(() => {

      scrollToSection("archive");

    }, 500);

  });


/* =====================================================
   DB에서 기억 불러오기
===================================================== */

async function loadMemories() {

  const archive =
    document.getElementById("archiveList");


  archive.innerHTML = `
    <div class="loading">
      기억을 불러오는 중...
    </div>
  `;


  const { data, error } =
    await supabaseClient
      .from("memories")
      .select("*")
      .order("created_at", {
        ascending: false
      });


  if (error) {

    console.error(error);

    archive.innerHTML = `
      <div class="loading">
        기억을 불러오지 못했습니다.<br>
        Supabase 설정을 확인해주세요.
      </div>
    `;

    return;

  }


  allMemories = data || [];


  renderMemories();

}


/* =====================================================
   Archive 출력
===================================================== */

function renderMemories() {

  const archive =
    document.getElementById("archiveList");


  let memories =
    currentCategory === "전체"
      ? allMemories
      : allMemories.filter(
          item =>
            item.category === currentCategory
        );


  document
    .getElementById("memoryCount")
    .textContent =
    allMemories.length;


  if (memories.length === 0) {

    archive.innerHTML = `
      <div class="loading">
        아직 남겨진 기억이 없어요.<br>
        첫 번째 기억을 남겨주세요.
      </div>
    `;

    return;

  }


  archive.innerHTML = "";


  memories.forEach((memory, index) => {

    const card =
      document.createElement("article");


    card.className =
      "archive-card";


    const number =
      String(index + 1)
        .padStart(2, "0");


    card.innerHTML = `

      <div class="tag">
        MEMORY #${number}
      </div>

      <h3>
        “${escapeHTML(memory.memory)}”
      </h3>

      ${
        memory.emotions
          ? `
            <div class="emotion">
              당시의 감정 ·
              ${escapeHTML(memory.emotions)}
            </div>
          `
          : ""
      }

      ${
        memory.current_feeling
          ? `
            <div class="emotion">
              지금의 기분 ·
              ${escapeHTML(
                memory.current_feeling
              )}
            </div>
          `
          : ""
      }

      ${
        memory.reflection
          ? `
            <div class="thought">
              기억이 남긴 생각<br>
              <strong>
                “${escapeHTML(
                  memory.reflection
                )}”
              </strong>
            </div>
          `
          : ""
      }

    `;


    archive.appendChild(card);

  });

}


/* =====================================================
   카테고리
===================================================== */

document
  .querySelectorAll(".category")
  .forEach(button => {

    button.addEventListener("click", () => {

      document
        .querySelectorAll(".category")
        .forEach(item => {

          item.classList.remove("active");

        });


      button.classList.add("active");


      currentCategory =
        button.dataset.category;


      renderMemories();

    });

  });


/* =====================================================
   실시간 데이터 연결
===================================================== */

function subscribeToMemories() {

  supabaseClient

    .channel("memory-realtime")

    .on(
      "postgres_changes",

      {
        event: "INSERT",

        schema: "public",

        table: "memories"

      },

      payload => {

        /*
          다른 사람이 새 기억을 남기면
          페이지 새로고침 없이 바로 추가
        */

        allMemories.unshift(
          payload.new
        );


        renderMemories();

      }

    )

    .subscribe();

}


/* =====================================================
   공감
===================================================== */

function showEmpathy(message) {

  document
    .getElementById("empathyResult")
    .textContent =
    `“${message}” 마음이 전달되었어요.`;

}


/* =====================================================
   HTML 보안 처리
===================================================== */

function escapeHTML(text) {

  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* =====================================================
   시작
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    updateStep(1);

    await loadMemories();

    subscribeToMemories();

  }
);
