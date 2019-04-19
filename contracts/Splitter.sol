pragma solidity >=0.4.21 <0.6.0;

import './Pausable.sol';
import './SafeMath.sol';

contract Splitter is Pausable {
    // library
    using SafeMath for uint;

    // balance
    mapping(address => uint) private _balanceOf;

    // constructor
    constructor(bool isRunning)
        public
        Pausable(isRunning)
        {}

    // event
    event SplitEvent(
        address indexed from,
        uint amount,
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
        runningOnly
    {
        require(receiver1 != address(0x0) && receiver2 != address(0x0));
        // get haft
        uint half = msg.value.div(2);

        // record balances
        _balanceOf[receiver1] = _balanceOf[receiver1].add(half);
        _balanceOf[receiver2] = _balanceOf[receiver2].add(half);

        // emit event
        emit SplitEvent(msg.sender, msg.value, receiver1, receiver2);
        
        // odd number, return the change.
        if(msg.value.mod(2) > 0) msg.sender.transfer(1);
    }

    // withdraw
    function withdraw()
        public
        runningOnly
    {
        uint balance = _balanceOf[msg.sender];

        // check amount >0
        require(balance > 0);

        // set balance to zero
        _balanceOf[msg.sender] = 0;

        // event
        emit WithdrawEvent(msg.sender, balance);

        // transfer
        msg.sender.transfer(balance);
    }
}