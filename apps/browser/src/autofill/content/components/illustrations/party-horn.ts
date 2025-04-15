import { html } from "lit";

import { ThemeTypes } from "@bitwarden/common/platform/enums";

import { IconProps } from "../common-types";

// This icon has static multi-colors for each theme
export function PartyHorn({ theme }: IconProps) {
  if (theme === ThemeTypes.Dark) {
    return html`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" fill="none">
        <path
          d="M32.6273 37.2714L3.88045 49.2492C2.98525 49.6222 1.95344 49.4181 1.26769 48.7323C0.581933 48.0466 0.377816 47.0148 0.750816 46.1196L12.7287 17.3728C13.622 15.2288 15.9911 14.1069 18.2158 14.7743L19.0257 15.0173C26.6887 17.3161 32.6839 23.3113 34.9828 30.9743L35.2257 31.7842C35.8931 34.0089 34.7712 36.3781 32.6273 37.2714Z"
          fill="#FFBF00"
        />
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M14.6426 44.7649C12.9332 43.4627 11.2495 41.9951 9.62721 40.3728C8.00492 38.7505 6.53732 37.0668 5.23507 35.3574L5.74088 34.1434C7.10571 35.9897 8.67231 37.8151 10.4286 39.5714C12.1848 41.3277 14.0103 42.8943 15.8566 44.2591L14.6426 44.7649ZM9.86079 46.7574C8.69632 45.7641 7.54698 44.7037 6.42165 43.5783C5.29632 42.453 4.23589 41.3037 3.24264 40.1392L2.755 41.3095C3.65901 42.3487 4.6147 43.3741 5.62028 44.3797C6.62586 45.3853 7.65127 46.341 8.69048 47.245L9.86079 46.7574ZM21.0629 42.0898C18.5607 40.5957 16.0508 38.6488 13.701 36.299C11.3512 33.9492 9.40432 31.4393 7.91017 28.9371L8.45815 27.622C9.94515 30.2728 11.9779 32.973 14.5024 35.4976C17.027 38.0221 19.7272 40.0548 22.378 41.5418L21.0629 42.0898ZM10.9297 21.6902C11.8698 25.118 14.18 28.9793 17.6004 32.3996C21.0207 35.82 24.882 38.1302 28.3098 39.0703L30.1472 38.3047C29.5643 38.2191 28.9477 38.0815 28.3004 37.8889C25.1702 36.9575 21.6052 34.8017 18.4018 31.5982C15.1983 28.3948 13.0425 24.8297 12.1111 21.6996C11.9185 21.0523 11.7809 20.4357 11.6953 19.8528L10.9297 21.6902Z"
          fill="#F3F6F9"
        />
        <path
          d="M27.706 22.294C32.3531 26.9411 34.6852 32.1435 32.9149 33.9138C31.1445 35.6842 25.9421 33.3521 21.295 28.7049C16.6479 24.0578 14.3158 18.8554 16.0861 17.085C17.8564 15.3147 23.0588 17.6468 27.706 22.294Z"
          fill="#79A1E9"
        />
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M31.6828 29.6463C30.8097 27.6986 29.1563 25.347 26.9046 23.0953C24.6529 20.8436 22.3013 19.1902 20.3536 18.3171C19.376 17.8788 18.5567 17.6628 17.9359 17.6303C17.3148 17.5979 17.0236 17.7503 16.8875 17.8864C16.7514 18.0225 16.5989 18.3138 16.6314 18.9349C16.6638 19.5556 16.8799 20.3749 17.3182 21.3526C18.1912 23.3003 19.8447 25.6519 22.0964 27.9035C24.3481 30.1552 26.6996 31.8087 28.6473 32.6818C29.625 33.12 30.4443 33.3361 31.0651 33.3685C31.6862 33.401 31.9774 33.2486 32.1135 33.1125C32.2496 32.9763 32.402 32.6851 32.3696 32.064C32.3371 31.4433 32.1211 30.624 31.6828 29.6463ZM32.9149 33.9138C34.6852 32.1435 32.3531 26.9411 27.706 22.294C23.0588 17.6468 17.8564 15.3147 16.0861 17.085C14.3158 18.8554 16.6479 24.0578 21.295 28.7049C25.9421 33.3521 31.1445 35.6842 32.9149 33.9138Z"
          fill="#175DDC"
        />
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M18.053 15.3169C16.1064 14.7329 14.0334 15.7146 13.2517 17.5906L1.2739 46.3374C0.989218 47.0206 1.14501 47.8081 1.66839 48.3315C2.19178 48.8549 2.97928 49.0107 3.66253 48.726L32.4093 36.7482C34.2853 35.9665 35.267 33.8935 34.683 31.9469L34.44 31.137C32.1959 23.6565 26.3434 17.804 18.8629 15.5599L18.053 15.3169ZM12.2056 17.1547C13.2106 14.7428 15.8759 13.4806 18.3786 14.2314L19.1886 14.4744C27.034 16.828 33.1719 22.9659 35.5256 30.8113L35.7685 31.6213C36.5193 34.124 35.2571 36.7893 32.8452 37.7943L4.09841 49.7721C2.99125 50.2335 1.71514 49.981 0.867022 49.1329C0.0189018 48.2848 -0.233545 47.0087 0.227771 45.9015L12.2056 17.1547Z"
          fill="#175DDC"
        />
        <path
          d="M24.65 0.331121C24.6952 0.137206 24.8681 0 25.0672 0C25.2663 0 25.4391 0.137206 25.4843 0.331121L25.5055 0.421998C25.7994 1.68306 26.784 2.66773 28.0451 2.9616L28.136 2.98277C28.3299 3.02796 28.4671 3.20082 28.4671 3.39993C28.4671 3.59904 28.3299 3.77189 28.136 3.81708L28.0451 3.83826C26.784 4.13212 25.7994 5.11679 25.5055 6.37786L25.4843 6.46873C25.4391 6.66265 25.2663 6.79985 25.0672 6.79985C24.8681 6.79985 24.6952 6.66265 24.65 6.46873L24.6288 6.37786C24.335 5.11679 23.3503 4.13212 22.0892 3.83826L21.9984 3.81708C21.8044 3.77189 21.6672 3.59904 21.6672 3.39993C21.6672 3.20082 21.8044 3.02796 21.9984 2.98277L22.0892 2.9616C23.3503 2.66773 24.335 1.68306 24.6288 0.421997L24.65 0.331121Z"
          fill="#175DDC"
        />
        <path
          d="M46.183 8.83088C46.2282 8.63696 46.401 8.49976 46.6001 8.49976C46.7992 8.49976 46.9721 8.63696 47.0173 8.83088L47.0385 8.92175C47.3323 10.1828 48.317 11.1675 49.5781 11.4614L49.6689 11.4825C49.8628 11.5277 50 11.7006 50 11.8997C50 12.0988 49.8628 12.2716 49.6689 12.3168L49.5781 12.338C48.317 12.6319 47.3323 13.6165 47.0385 14.8776L47.0173 14.9685C46.9721 15.1624 46.7992 15.2996 46.6001 15.2996C46.401 15.2996 46.2282 15.1624 46.183 14.9685L46.1618 14.8776C45.8679 13.6165 44.8833 12.6319 43.6222 12.338L43.5313 12.3168C43.3374 12.2716 43.2002 12.0988 43.2002 11.8997C43.2002 11.7006 43.3374 11.5277 43.5313 11.4825L43.6222 11.4614C44.8833 11.1675 45.8679 10.1828 46.1618 8.92175L46.183 8.83088Z"
          fill="#175DDC"
        />
        <path
          d="M38.8164 43.3968C38.8616 43.2029 39.0344 43.0657 39.2335 43.0657C39.4327 43.0657 39.6055 43.2029 39.6507 43.3968L39.6719 43.4877C39.9657 44.7487 40.9504 45.7334 42.2115 46.0273L42.3024 46.0484C42.4963 46.0936 42.6335 46.2665 42.6335 46.4656C42.6335 46.6647 42.4963 46.8376 42.3024 46.8828L42.2115 46.9039C40.9504 47.1978 39.9657 48.1825 39.6719 49.4435L39.6507 49.5344C39.6055 49.7283 39.4327 49.8655 39.2335 49.8655C39.0344 49.8655 38.8616 49.7283 38.8164 49.5344L38.7952 49.4435C38.5013 48.1825 37.5167 47.1978 36.2556 46.9039L36.1647 46.8828C35.9708 46.8376 35.8336 46.6647 35.8336 46.4656C35.8336 46.2665 35.9708 46.0936 36.1647 46.0484L36.2556 46.0273C37.5167 45.7334 38.5013 44.7487 38.7952 43.4877L38.8164 43.3968Z"
          fill="#175DDC"
        />
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M43.5439 27.4056C41.9949 25.8565 39.4834 25.8565 37.9343 27.4056C37.713 27.6269 37.3543 27.6269 37.133 27.4056C36.9117 27.1843 36.9117 26.8255 37.133 26.6042C39.1246 24.6126 42.3537 24.6126 44.3453 26.6042C44.5666 26.8255 44.5666 27.1843 44.3453 27.4056C44.124 27.6269 43.7652 27.6269 43.5439 27.4056Z"
          fill="#175DDC"
        />
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M46.1043 21.7127C42.8784 19.8502 38.7535 20.9555 36.891 24.1814C36.7346 24.4524 36.388 24.5452 36.117 24.3888C35.8459 24.2323 35.7531 23.8857 35.9096 23.6147C38.085 19.8468 42.903 18.5558 46.671 20.7312C46.942 20.8877 47.0349 21.2342 46.8784 21.5053C46.7219 21.7763 46.3753 21.8691 46.1043 21.7127Z"
          fill="#175DDC"
        />
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M11.4675 7.93311C13.6582 7.93311 15.4341 9.70901 15.4341 11.8997C15.4341 12.2127 15.6878 12.4664 16.0007 12.4664C16.3137 12.4664 16.5674 12.2127 16.5674 11.8997C16.5674 9.0831 14.2841 6.7998 11.4675 6.7998C11.1545 6.7998 10.9008 7.0535 10.9008 7.36646C10.9008 7.67941 11.1545 7.93311 11.4675 7.93311Z"
          fill="#175DDC"
        />
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M14.553 3.36429C16.6057 4.12949 17.6494 6.41384 16.8842 8.46654C16.7749 8.75978 16.924 9.08612 17.2173 9.19543C17.5105 9.30475 17.8368 9.15564 17.9462 8.8624C18.93 6.22322 17.5881 3.28619 14.9489 2.30236C14.6556 2.19305 14.3293 2.34215 14.22 2.63539C14.1107 2.92864 14.2598 3.25497 14.553 3.36429Z"
          fill="#175DDC"
        />
        <path
          d="M34.7004 9.63307C34.7004 10.8849 33.6856 11.8997 32.4337 11.8997C31.1819 11.8997 30.1671 10.8849 30.1671 9.63307C30.1671 8.38125 31.1819 7.36646 32.4337 7.36646C33.6856 7.36646 34.7004 8.38125 34.7004 9.63307Z"
          fill="#79A1E9"
        />
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M32.4337 10.7664C33.0596 10.7664 33.567 10.259 33.567 9.63307C33.567 9.00716 33.0596 8.49976 32.4337 8.49976C31.8078 8.49976 31.3004 9.00716 31.3004 9.63307C31.3004 10.259 31.8078 10.7664 32.4337 10.7664ZM32.4337 11.8997C33.6856 11.8997 34.7004 10.8849 34.7004 9.63307C34.7004 8.38125 33.6856 7.36646 32.4337 7.36646C31.1819 7.36646 30.1671 8.38125 30.1671 9.63307C30.1671 10.8849 31.1819 11.8997 32.4337 11.8997Z"
          fill="#175DDC"
        />
        <path
          d="M38.1002 16.4329C38.1002 17.3717 37.3391 18.1328 36.4003 18.1328C35.4614 18.1328 34.7003 17.3717 34.7003 16.4329C34.7003 15.494 35.4614 14.7329 36.4003 14.7329C37.3391 14.7329 38.1002 15.494 38.1002 16.4329Z"
          fill="#AAC3EF"
        />
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M36.4003 16.9995C36.7132 16.9995 36.9669 16.7458 36.9669 16.4329C36.9669 16.1199 36.7132 15.8662 36.4003 15.8662C36.0873 15.8662 35.8336 16.1199 35.8336 16.4329C35.8336 16.7458 36.0873 16.9995 36.4003 16.9995ZM36.4003 18.1328C37.3391 18.1328 38.1002 17.3717 38.1002 16.4329C38.1002 15.494 37.3391 14.7329 36.4003 14.7329C35.4614 14.7329 34.7003 15.494 34.7003 16.4329C34.7003 17.3717 35.4614 18.1328 36.4003 18.1328Z"
          fill="#175DDC"
        />
        <path
          d="M31.8671 44.199C31.8671 45.1379 31.106 45.899 30.1671 45.899C29.2283 45.899 28.4672 45.1379 28.4672 44.199C28.4672 43.2601 29.2283 42.499 30.1671 42.499C31.106 42.499 31.8671 43.2601 31.8671 44.199Z"
          fill="#AAC3EF"
        />
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M30.1671 44.7656C30.4801 44.7656 30.7338 44.5119 30.7338 44.199C30.7338 43.886 30.4801 43.6323 30.1671 43.6323C29.8542 43.6323 29.6005 43.886 29.6005 44.199C29.6005 44.5119 29.8542 44.7656 30.1671 44.7656ZM30.1671 45.899C31.106 45.899 31.8671 45.1379 31.8671 44.199C31.8671 43.2601 31.106 42.499 30.1671 42.499C29.2283 42.499 28.4672 43.2601 28.4672 44.199C28.4672 45.1379 29.2283 45.899 30.1671 45.899Z"
          fill="#175DDC"
        />
        <path
          d="M47.7334 33.9993C47.7334 35.5641 46.4649 36.8326 44.9002 36.8326C43.3354 36.8326 42.0669 35.5641 42.0669 33.9993C42.0669 32.4345 43.3354 31.166 44.9002 31.166C46.4649 31.166 47.7334 32.4345 47.7334 33.9993Z"
          fill="#FFBF00"
        />
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M44.9002 35.6993C45.839 35.6993 46.6001 34.9382 46.6001 33.9993C46.6001 33.0604 45.839 32.2993 44.9002 32.2993C43.9613 32.2993 43.2002 33.0604 43.2002 33.9993C43.2002 34.9382 43.9613 35.6993 44.9002 35.6993ZM44.9002 36.8326C46.4649 36.8326 47.7334 35.5641 47.7334 33.9993C47.7334 32.4345 46.4649 31.166 44.9002 31.166C43.3354 31.166 42.0669 32.4345 42.0669 33.9993C42.0669 35.5641 43.3354 36.8326 44.9002 36.8326Z"
          fill="#175DDC"
        />
        <path
          d="M29.0337 13.3163C29.0337 14.4116 28.1458 15.2996 27.0504 15.2996C25.9551 15.2996 25.0671 14.4116 25.0671 13.3163C25.0671 12.221 25.9551 11.333 27.0504 11.333C28.1458 11.333 29.0337 12.221 29.0337 13.3163Z"
          fill="#FFBF00"
        />
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M27.0504 14.1663C27.5199 14.1663 27.9004 13.7857 27.9004 13.3163C27.9004 12.8469 27.5199 12.4663 27.0504 12.4663C26.581 12.4663 26.2004 12.8469 26.2004 13.3163C26.2004 13.7857 26.581 14.1663 27.0504 14.1663ZM27.0504 15.2996C28.1458 15.2996 29.0337 14.4116 29.0337 13.3163C29.0337 12.221 28.1458 11.333 27.0504 11.333C25.9551 11.333 25.0671 12.221 25.0671 13.3163C25.0671 14.4116 25.9551 15.2996 27.0504 15.2996Z"
          fill="#175DDC"
        />
        <path
          d="M45.4667 3.96658C45.4667 6.15726 43.6908 7.93316 41.5002 7.93316C39.3095 7.93316 37.5336 6.15726 37.5336 3.96658C37.5336 1.7759 39.3095 0 41.5002 0C43.6908 0 45.4667 1.7759 45.4667 3.96658Z"
          fill="#F3F6F9"
        />
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M41.5002 6.79985C43.0649 6.79985 44.3334 5.53136 44.3334 3.96658C44.3334 2.40181 43.0649 1.13331 41.5002 1.13331C39.9354 1.13331 38.6669 2.40181 38.6669 3.96658C38.6669 5.53136 39.9354 6.79985 41.5002 6.79985ZM41.5002 7.93316C43.6908 7.93316 45.4667 6.15726 45.4667 3.96658C45.4667 1.7759 43.6908 0 41.5002 0C39.3095 0 37.5336 1.7759 37.5336 3.96658C37.5336 6.15726 39.3095 7.93316 41.5002 7.93316Z"
          fill="#175DDC"
        />
      </svg>
    `;
  }

  return html`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" fill="none">
      <path
        d="M32.6275 37.2714L3.88069 49.2492C2.98549 49.6222 1.95368 49.4181 1.26793 48.7323C0.582178 48.0466 0.37806 47.0148 0.751061 46.1196L12.7289 17.3728C13.6222 15.2288 15.9914 14.1069 18.216 14.7743L19.026 15.0173C26.6889 17.3161 32.6841 23.3113 34.983 30.9743L35.226 31.7842C35.8934 34.0089 34.7714 36.3781 32.6275 37.2714Z"
        fill="#FFBF00"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M14.6425 44.7649C12.9331 43.4627 11.2494 41.9951 9.62709 40.3728C8.00479 38.7505 6.53719 37.0668 5.23494 35.3574L5.74076 34.1434C7.10558 35.9897 8.67219 37.8151 10.4285 39.5714C12.1847 41.3277 14.0102 42.8943 15.8565 44.2591L14.6425 44.7649ZM9.86067 46.7574C8.6962 45.7641 7.54686 44.7037 6.42153 43.5783C5.2962 42.453 4.23577 41.3037 3.24251 40.1392L2.75488 41.3095C3.65889 42.3487 4.61458 43.3741 5.62016 44.3797C6.62574 45.3853 7.65114 46.341 8.69036 47.245L9.86067 46.7574ZM21.0628 42.0898C18.5605 40.5957 16.0507 38.6488 13.7009 36.299C11.3511 33.9492 9.40419 31.4393 7.91005 28.9371L8.45802 27.622C9.94503 30.2728 11.9777 32.973 14.5023 35.4976C17.0268 38.0221 19.7271 40.0548 22.3779 41.5418L21.0628 42.0898ZM10.9296 21.6902C11.8696 25.118 14.1799 28.9793 17.6003 32.3996C21.0206 35.82 24.8819 38.1302 28.3097 39.0703L30.1471 38.3047C29.5641 38.2191 28.9476 38.0815 28.3003 37.8889C25.1701 36.9575 21.6051 34.8017 18.4016 31.5982C15.1982 28.3948 13.0424 24.8297 12.111 21.6996C11.9184 21.0523 11.7808 20.4357 11.6952 19.8528L10.9296 21.6902Z"
        fill="white"
      />
      <path
        d="M27.7062 22.294C32.3534 26.9411 34.6855 32.1435 32.9151 33.9138C31.1448 35.6842 25.9424 33.3521 21.2952 28.7049C16.6481 24.0578 14.316 18.8554 16.0863 17.085C17.8567 15.3147 23.0591 17.6468 27.7062 22.294Z"
        fill="#99BAF4"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M31.6831 29.6463C30.81 27.6986 29.1565 25.347 26.9048 23.0953C24.6532 20.8436 22.3016 19.1902 20.3539 18.3171C19.3762 17.8788 18.5569 17.6628 17.9362 17.6303C17.3151 17.5979 17.0238 17.7503 16.8877 17.8864C16.7516 18.0225 16.5992 18.3138 16.6316 18.9349C16.6641 19.5556 16.8801 20.3749 17.3184 21.3526C18.1915 23.3003 19.8449 25.6519 22.0966 27.9035C24.3483 30.1552 26.6999 31.8087 28.6476 32.6818C29.6253 33.12 30.4446 33.3361 31.0653 33.3685C31.6864 33.401 31.9776 33.2486 32.1138 33.1125C32.2499 32.9763 32.4023 32.6851 32.3698 32.064C32.3374 31.4433 32.1213 30.624 31.6831 29.6463ZM32.9151 33.9138C34.6855 32.1435 32.3534 26.9411 27.7062 22.294C23.0591 17.6468 17.8567 15.3147 16.0863 17.085C14.316 18.8554 16.6481 24.0578 21.2952 28.7049C25.9424 33.3521 31.1448 35.6842 32.9151 33.9138Z"
        fill="#0E3781"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M18.053 15.317C16.1064 14.733 14.0334 15.7148 13.2517 17.5907L1.2739 46.3375C0.989218 47.0207 1.14501 47.8083 1.66839 48.3316C2.19178 48.855 2.97928 49.0108 3.66253 48.7261L32.4093 36.7483C34.2853 35.9666 35.267 33.8936 34.683 31.947L34.44 31.1371C32.1959 23.6566 26.3434 17.8041 18.8629 15.56L18.053 15.317ZM12.2056 17.1548C13.2106 14.7429 15.8759 13.4807 18.3786 14.2315L19.1886 14.4745C27.034 16.8281 33.1719 22.966 35.5256 30.8115L35.7685 31.6214C36.5193 34.1241 35.2571 36.7895 32.8452 37.7944L4.09841 49.7723C2.99125 50.2336 1.71514 49.9811 0.867022 49.133C0.0189018 48.2849 -0.233545 47.0088 0.227771 45.9016L12.2056 17.1548Z"
        fill="#0E3781"
      />
      <path
        d="M24.6503 0.331121C24.6954 0.137206 24.8683 0 25.0674 0C25.2665 0 25.4394 0.137206 25.4846 0.331121L25.5057 0.421998C25.7996 1.68306 26.7843 2.66773 28.0453 2.9616L28.1362 2.98277C28.3301 3.02796 28.4673 3.20082 28.4673 3.39993C28.4673 3.59904 28.3301 3.77189 28.1362 3.81708L28.0453 3.83826C26.7843 4.13212 25.7996 5.11679 25.5057 6.37786L25.4846 6.46873C25.4394 6.66265 25.2665 6.79985 25.0674 6.79985C24.8683 6.79985 24.6954 6.66265 24.6503 6.46873L24.6291 6.37786C24.3352 5.11679 23.3505 4.13212 22.0895 3.83826L21.9986 3.81708C21.8047 3.77189 21.6675 3.59904 21.6675 3.39993C21.6675 3.20082 21.8047 3.02796 21.9986 2.98277L22.0895 2.9616C23.3505 2.66773 24.3352 1.68306 24.6291 0.421997L24.6503 0.331121Z"
        fill="#0E3781"
      />
      <path
        d="M46.183 8.831C46.2282 8.63708 46.401 8.49988 46.6001 8.49988C46.7992 8.49988 46.9721 8.63708 47.0173 8.831L47.0385 8.92188C47.3323 10.1829 48.317 11.1676 49.5781 11.4615L49.6689 11.4827C49.8628 11.5278 50 11.7007 50 11.8998C50 12.0989 49.8628 12.2718 49.6689 12.317L49.5781 12.3381C48.317 12.632 47.3323 13.6167 47.0385 14.8777L47.0173 14.9686C46.9721 15.1625 46.7992 15.2997 46.6001 15.2997C46.401 15.2997 46.2282 15.1625 46.183 14.9686L46.1618 14.8777C45.8679 13.6167 44.8833 12.632 43.6222 12.3381L43.5313 12.317C43.3374 12.2718 43.2002 12.0989 43.2002 11.8998C43.2002 11.7007 43.3374 11.5278 43.5313 11.4827L43.6222 11.4615C44.8833 11.1676 45.8679 10.1829 46.1618 8.92188L46.183 8.831Z"
        fill="#0E3781"
      />
      <path
        d="M38.8163 43.3969C38.8615 43.203 39.0343 43.0658 39.2334 43.0658C39.4325 43.0658 39.6054 43.203 39.6506 43.3969L39.6718 43.4878C39.9656 44.7489 40.9503 45.7335 42.2114 46.0274L42.3022 46.0486C42.4961 46.0938 42.6334 46.2666 42.6334 46.4657C42.6334 46.6648 42.4961 46.8377 42.3022 46.8829L42.2114 46.9041C40.9503 47.1979 39.9656 48.1826 39.6718 49.4437L39.6506 49.5345C39.6054 49.7284 39.4325 49.8657 39.2334 49.8657C39.0343 49.8657 38.8615 49.7284 38.8163 49.5345L38.7951 49.4437C38.5012 48.1826 37.5166 47.1979 36.2555 46.9041L36.1646 46.8829C35.9707 46.8377 35.8335 46.6648 35.8335 46.4657C35.8335 46.2666 35.9707 46.0938 36.1646 46.0486L36.2555 46.0274C37.5166 45.7335 38.5012 44.7489 38.7951 43.4878L38.8163 43.3969Z"
        fill="#0E3781"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M43.5441 27.4057C41.995 25.8567 39.4835 25.8567 37.9345 27.4057C37.7132 27.627 37.3544 27.627 37.1331 27.4057C36.9118 27.1844 36.9118 26.8256 37.1331 26.6043C39.1247 24.6127 42.3538 24.6127 44.3454 26.6043C44.5667 26.8256 44.5667 27.1844 44.3454 27.4057C44.1241 27.627 43.7653 27.627 43.5441 27.4057Z"
        fill="#0E3781"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M46.1044 21.7127C42.8786 19.8502 38.7536 20.9555 36.8912 24.1814C36.7347 24.4524 36.3881 24.5452 36.1171 24.3888C35.8461 24.2323 35.7532 23.8857 35.9097 23.6147C38.0851 19.8468 42.9032 18.5558 46.6711 20.7312C46.9421 20.8877 47.035 21.2342 46.8785 21.5053C46.722 21.7763 46.3755 21.8691 46.1044 21.7127Z"
        fill="#0E3781"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M11.4675 7.93311C13.6582 7.93311 15.4341 9.70901 15.4341 11.8997C15.4341 12.2127 15.6878 12.4664 16.0007 12.4664C16.3137 12.4664 16.5674 12.2127 16.5674 11.8997C16.5674 9.0831 14.2841 6.7998 11.4675 6.7998C11.1545 6.7998 10.9008 7.0535 10.9008 7.36646C10.9008 7.67941 11.1545 7.93311 11.4675 7.93311Z"
        fill="#0E3781"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M14.553 3.36429C16.6057 4.12949 17.6494 6.41384 16.8842 8.46654C16.7749 8.75978 16.924 9.08612 17.2173 9.19543C17.5105 9.30475 17.8368 9.15564 17.9462 8.8624C18.93 6.22322 17.5881 3.28619 14.9489 2.30236C14.6556 2.19305 14.3293 2.34215 14.22 2.63539C14.1107 2.92864 14.2598 3.25497 14.553 3.36429Z"
        fill="#0E3781"
      />
      <path
        d="M34.7002 9.63307C34.7002 10.8849 33.6854 11.8997 32.4336 11.8997C31.1818 11.8997 30.167 10.8849 30.167 9.63307C30.167 8.38125 31.1818 7.36646 32.4336 7.36646C33.6854 7.36646 34.7002 8.38125 34.7002 9.63307Z"
        fill="#99BAF4"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M32.4336 10.7664C33.0595 10.7664 33.5669 10.259 33.5669 9.63307C33.5669 9.00716 33.0595 8.49976 32.4336 8.49976C31.8077 8.49976 31.3003 9.00716 31.3003 9.63307C31.3003 10.259 31.8077 10.7664 32.4336 10.7664ZM32.4336 11.8997C33.6854 11.8997 34.7002 10.8849 34.7002 9.63307C34.7002 8.38125 33.6854 7.36646 32.4336 7.36646C31.1818 7.36646 30.167 8.38125 30.167 9.63307C30.167 10.8849 31.1818 11.8997 32.4336 11.8997Z"
        fill="#0E3781"
      />
      <path
        d="M38.1001 16.433C38.1001 17.3719 37.339 18.133 36.4002 18.133C35.4613 18.133 34.7002 17.3719 34.7002 16.433C34.7002 15.4941 35.4613 14.733 36.4002 14.733C37.339 14.733 38.1001 15.4941 38.1001 16.433Z"
        fill="#DBE5F6"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M36.4002 16.9997C36.7131 16.9997 36.9668 16.746 36.9668 16.433C36.9668 16.12 36.7131 15.8663 36.4002 15.8663C36.0872 15.8663 35.8335 16.12 35.8335 16.433C35.8335 16.746 36.0872 16.9997 36.4002 16.9997ZM36.4002 18.133C37.339 18.133 38.1001 17.3719 38.1001 16.433C38.1001 15.4941 37.339 14.733 36.4002 14.733C35.4613 14.733 34.7002 15.4941 34.7002 16.433C34.7002 17.3719 35.4613 18.133 36.4002 18.133Z"
        fill="#0E3781"
      />
      <path
        d="M31.8672 44.1991C31.8672 45.138 31.1061 45.8991 30.1672 45.8991C29.2284 45.8991 28.4673 45.138 28.4673 44.1991C28.4673 43.2602 29.2284 42.4991 30.1672 42.4991C31.1061 42.4991 31.8672 43.2602 31.8672 44.1991Z"
        fill="#DBE5F6"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M30.1672 44.7658C30.4802 44.7658 30.7339 44.5121 30.7339 44.1991C30.7339 43.8862 30.4802 43.6325 30.1672 43.6325C29.8543 43.6325 29.6006 43.8862 29.6006 44.1991C29.6006 44.5121 29.8543 44.7658 30.1672 44.7658ZM30.1672 45.8991C31.1061 45.8991 31.8672 45.138 31.8672 44.1991C31.8672 43.2602 31.1061 42.4991 30.1672 42.4991C29.2284 42.4991 28.4673 43.2602 28.4673 44.1991C28.4673 45.138 29.2284 45.8991 30.1672 45.8991Z"
        fill="#0E3781"
      />
      <path
        d="M47.7334 33.9993C47.7334 35.5641 46.4649 36.8326 44.9002 36.8326C43.3354 36.8326 42.0669 35.5641 42.0669 33.9993C42.0669 32.4345 43.3354 31.166 44.9002 31.166C46.4649 31.166 47.7334 32.4345 47.7334 33.9993Z"
        fill="#FFBF00"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M44.9002 35.6993C45.839 35.6993 46.6001 34.9382 46.6001 33.9993C46.6001 33.0604 45.839 32.2993 44.9002 32.2993C43.9613 32.2993 43.2002 33.0604 43.2002 33.9993C43.2002 34.9382 43.9613 35.6993 44.9002 35.6993ZM44.9002 36.8326C46.4649 36.8326 47.7334 35.5641 47.7334 33.9993C47.7334 32.4345 46.4649 31.166 44.9002 31.166C43.3354 31.166 42.0669 32.4345 42.0669 33.9993C42.0669 35.5641 43.3354 36.8326 44.9002 36.8326Z"
        fill="#0E3781"
      />
      <path
        d="M29.034 13.3164C29.034 14.4118 28.146 15.2997 27.0507 15.2997C25.9553 15.2997 25.0674 14.4118 25.0674 13.3164C25.0674 12.2211 25.9553 11.3331 27.0507 11.3331C28.146 11.3331 29.034 12.2211 29.034 13.3164Z"
        fill="#FFBF00"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M27.0507 14.1664C27.5201 14.1664 27.9007 13.7859 27.9007 13.3164C27.9007 12.847 27.5201 12.4664 27.0507 12.4664C26.5812 12.4664 26.2007 12.847 26.2007 13.3164C26.2007 13.7859 26.5812 14.1664 27.0507 14.1664ZM27.0507 15.2997C28.146 15.2997 29.034 14.4118 29.034 13.3164C29.034 12.2211 28.146 11.3331 27.0507 11.3331C25.9553 11.3331 25.0674 12.2211 25.0674 13.3164C25.0674 14.4118 25.9553 15.2997 27.0507 15.2997Z"
        fill="#0E3781"
      />
      <path
        d="M45.4669 3.96658C45.4669 6.15726 43.691 7.93316 41.5003 7.93316C39.3096 7.93316 37.5337 6.15726 37.5337 3.96658C37.5337 1.7759 39.3096 0 41.5003 0C43.691 0 45.4669 1.7759 45.4669 3.96658Z"
        fill="white"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M41.5003 6.79985C43.065 6.79985 44.3335 5.53136 44.3335 3.96658C44.3335 2.40181 43.065 1.13331 41.5003 1.13331C39.9355 1.13331 38.667 2.40181 38.667 3.96658C38.667 5.53136 39.9355 6.79985 41.5003 6.79985ZM41.5003 7.93316C43.691 7.93316 45.4669 6.15726 45.4669 3.96658C45.4669 1.7759 43.691 0 41.5003 0C39.3096 0 37.5337 1.7759 37.5337 3.96658C37.5337 6.15726 39.3096 7.93316 41.5003 7.93316Z"
        fill="#0E3781"
      />
    </svg>
  `;
}
