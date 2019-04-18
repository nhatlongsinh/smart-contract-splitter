pragma solidity >=0.4.21 <0.6.0;

import './Pausable.sol';

contract Splitter is Pausable {
    // balance
    mapping(address => uint) private _balanceOf;

    // event
    event SplitEvent(
        address indexed from,
        address indexed receiver1,
        address indexed receiver2
    );
    event WithdrawEvent(
        address indexed receiver,
        uint amount
    );

    // check balance
    function balanceOf(address a)
        public
        view
        returns(uint balance)
    {
        balance = _balanceOf[a];
    }
    
    // Split
    function split(
        address payable receiver1,
        address payable receiver2
    )
        public
        payable
        ownerOnly
        runningOnly
    {
        require(receiver1 != address(0x0) && receiver2 != address(0x0));
        // get haft
        uint half = msg.value / 2;

        // record balances
        _balanceOf[receiver1] += half;
        _balanceOf[receiver2] += half;
        
        // odd number, return the change.
        if(msg.value % 2 > 0) msg.sender.transfer(1);

        // emit event
        emit SplitEvent(msg.sender, receiver1, receiver2);
    }

    // withdraw
    function withdraw()
        public
    {
        uint balance = _balanceOf[msg.sender];

        // check amount >0
        require(balance > 0);

        // set balance to zero
        _balanceOf[msg.sender] = 0;

        // transfer
        msg.sender.transfer(balance);

        // event
        emit WithdrawEvent(msg.sender, balance);
    }
}