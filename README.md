# EIP-1167: Minimal Proxy Contract (Clone Factory Pattern)

## 📘 개요

[EIP-1167](https://eips.ethereum.org/EIPS/eip-1167)은 **Minimal Proxy Contract**, 즉 "최소한의 바이트코드만 가진 경량 프록시"의 배포 표준입니다.  
이는 동일한 로직을 가진 컨트랙트를 대량으로 배포하거나, **가볍고 저렴하게 인스턴스를 생성**할 수 있는 방법으로 널리 사용됩니다.

## 🎯 배경

스마트 컨트랙트는 한 번 배포되면 변경이 불가능하기 때문에,

- 유사한 기능을 가진 컨트랙트를 여러 개 배포해야 하는 경우
- 비용 절감, 가스비 최적화가 중요한 경우

전통적인 방식으로는 **같은 바이트코드를 여러 번 배포**하게 되어:

- 가스 비용 낭비
- 유지보수 및 로직 변경 시 어려움
  등의 문제가 발생합니다.

이를 해결하기 위해, EIP-1167은 다음을 제안합니다:

> “로직은 한 번만 배포하고, 이후에는 delegatecall 기반의 경량 프록시로 재사용하자.”

---

## ⚙️ 개념

EIP-1167은 다음 구성요소로 이루어진 패턴입니다:

| 구성요소                  | 설명                                              |
| ------------------------- | ------------------------------------------------- |
| **Implementation**        | 원본 로직이 담긴 스마트 컨트랙트                  |
| **Minimal Proxy (Clone)** | delegatecall을 통해 로직을 위임하는 경량 컨트랙트 |
| **Factory**               | Proxy를 동적으로 생성하는 컨트랙트 또는 스크립트  |

Minimal Proxy는 단 55 bytes 정도의 바이트코드만으로 구성되어 있으며,  
로직 실행 시 항상 **원본 Implementation 컨트랙트에 delegatecall**을 수행합니다.

> ✅ 상태(state)는 Proxy에,  
> ✅ 로직(code)은 Implementation에 존재

---

## ✨ 특장점

### ✅ 1. **초저가 배포**

- 일반 컨트랙트 대비 **90% 이상 가스 절감**
- Factory 패턴과 결합 시 수천 개 인스턴스도 매우 저렴하게 생성 가능

### ✅ 2. **로직 재사용**

- 로직은 한 번만 배포 → **변경/버그 수정이 쉬움**
- 모든 인스턴스가 동일한 로직을 참조 → 유지보수 효율 극대화

### ✅ 3. **주소 예측 가능 (CREATE2 사용 시)**

- deterministic deployment (`CREATE2`)와 결합하면 미리 주소를 예측 가능
- 멀티체인 배포 및 off-chain 사전 등록 등에서 유용

### ✅ 4. **EIP-1167은 표준화됨**

- 프록시 구조가 **표준으로 명시**되어 있어 툴과 라이브러리 호환성이 좋음
  - OpenZeppelin `Clones` 라이브러리
  - Hardhat, Foundry, ethers.js 등에서 바로 사용 가능

---

## 🔐 보안 주의사항

- `delegatecall`을 사용하기 때문에, Proxy와 Implementation의 **스토리지 레이아웃은 반드시 일치**해야 합니다.
- 로직 컨트랙트가 변경되면 기존 인스턴스에 영향을 주지 않음 → **Upgrade 기능은 별도 구현 필요**

---

## 🧱 대표 라이브러리

- [`@openzeppelin/contracts/proxy/Clones.sol`](https://docs.openzeppelin.com/contracts/4.x/api/proxy#Clones)
- Hardhat / Foundry / Viem + ethers.js 기반 배포 가능

---

## 📎 참고

- [EIP-1167 공식 문서](https://eips.ethereum.org/EIPS/eip-1167)
- [OpenZeppelin Clones Docs](https://docs.openzeppelin.com/contracts/4.x/api/proxy#Clones)

---

## 🧪 예시 (Solidity)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/Clones.sol";

contract MyFactory {
    address public implementation;

    constructor(address _impl) {
        implementation = _impl;
    }

    function createClone() external returns (address clone) {
        clone = Clones.clone(implementation);
    }

    function createDeterministicClone(bytes32 salt) external returns (address clone) {
        clone = Clones.cloneDeterministic(implementation, salt);
    }

    function predictCloneAddress(bytes32 salt) external view returns (address predicted) {
        predicted = Clones.predictDeterministicAddress(implementation, salt, address(this));
    }
}
```

## ✅ 요약

| 항목      | 설명                                                     |
| --------- | -------------------------------------------------------- |
| 표준 번호 | EIP-1167                                                 |
| 목적      | 동일 로직을 가진 컨트랙트의 저비용 배포                  |
| 핵심 기술 | delegatecall + Minimal Bytecode                          |
| 대표 사례 | Gnosis Safe Factory, NFT Drop Factory, Wallet Factory 등 |
| 도입 이유 | 비용 최적화, 유지보수성, 배포 효율성 향상                |
