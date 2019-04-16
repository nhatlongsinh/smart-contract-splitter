pragma solidity >=0.4.21 <0.6.0;

import './Pausable.sol';

contract Splitter is Pausable{
    // addresses
    // address must be payable in order to call transfer function
    // https://solidity.readthedocs.io/en/v0.5.0/050-breaking-changes.html#explicitness-requirements
    address payable public _bob;
    address payable public _carol;
    
    // balance
    mapping(address=>uint) private _balanceOf;

    // event
    event splitEvent(address from, address bob, uint amountBob, address carol, uint amountCarol);
    event withdrawEvent(address receiver, uint amount);

    // constructor
    constructor(address payable bob, address payable carol) public {
        require(bob!=address(0x0) && carol!=address(0x0));

        _bob=bob;
        _carol=carol;
    }
    
    // Split
    function split() payable runningOnly ownerOnly public{
        (uint amountBob, uint amountCarol)=safeDivide(msg.value);

        // record balances
        _balanceOf[_bob]+=amountBob;
        _balanceOf[_carol]+=amountCarol;

        // execute withdraw order
        withdraw(_bob);
        withdraw(_carol);

        // emit event
        emit splitEvent(msg.sender,_bob, amountBob,_carol, amountCarol);
    }

    // withdraw
    function withdraw(address payable receiver) private{
        uint balance=_balanceOf[receiver];

        // check amount >0
        require(balance>0);

        // set balance to zero
        _balanceOf[receiver]=0;

        // transfer
        receiver.transfer(balance);
    }

    // safe divide amount
    function safeDivide(uint amount) private pure returns(uint, uint){
        require(amount>0);

        // calculate
        uint amount1=amount/2;
        uint amount2=amount-amount1;
        return (amount1,amount2);
    }
}