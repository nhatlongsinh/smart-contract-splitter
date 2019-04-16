pragma solidity >=0.4.21 <0.6.0;

import './Pausable.sol';

contract Splitter is Pausable{
    // addresses
    // address must be payable in order to call transfer function
    // https://solidity.readthedocs.io/en/v0.5.0/050-breaking-changes.html#explicitness-requirements
    address payable public _bob;
    address payable public _carol;

    // event
    event splitEvent(address from, address bob, uint amountBob, address carol, uint amountCarol);
    
    // modifier valid bob and carol address
    modifier validAddrOnly(){
        require(_bob!=address(0x0) && _carol!=address(0x0));
        _;
    }

    // constructor
    constructor(address payable bob, address payable carol) public {
        _bob=bob;
        _carol=carol;
    }
    
    // Split
    function split() payable runningOnly ownerOnly validAddrOnly public{
        (uint amountBob, uint amountCarol)=safeDivide(msg.value);
        _bob.transfer(amountBob);
        _carol.transfer(amountCarol);
        emit splitEvent(msg.sender,_bob, amountBob,_carol, amountCarol);
    }

    // safe divide amount
    function safeDivide(uint amount) private pure returns(uint, uint){
        require(amount>0);
        uint amount1=amount/2;
        uint amount2=amount-amount1;
        return (amount1,amount2);
    }
}