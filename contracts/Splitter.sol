pragma solidity >=0.4.21 <0.6.0;

import './Pausable.sol';

contract Splitter is Pausable {
    // addresses
    // address must be payable in order to call transfer function
    // https://solidity.readthedocs.io/en/v0.5.0/050-breaking-changes.html#explicitness-requirements
    address payable public _bob;
    address payable public _carol;
    
    // balance
    mapping(address=>uint) private _balanceOf;

    // event
    event SplitEvent(
        address from,
        address bob,
        uint amountBob,
        address carol,
        uint amountCarol
    );
    event WithdrawEvent(
        address indexed receiver,
        uint amount
    );

    // constructor
    constructor(
        address payable bob,
        address payable carol
    )
    public
    {
        require(bob != address(0x0) && carol != address(0x0));

        _bob = bob;
        _carol = carol;
    }

    // check balance
    function balanceOf(address a)
        public
        view
        returns(uint balance)
    {
        balance = _balanceOf[a];
    }
    
    // Split
    function split()
        public
        payable
        ownerOnly
        runningOnly
    {
        (uint amountBob, uint amountCarol) = safeDivide(msg.value);

        // record balances
        _balanceOf[_bob] += amountBob;
        _balanceOf[_carol] += amountCarol;

        // emit event
        emit SplitEvent(msg.sender,_bob, amountBob,_carol, amountCarol);
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

    // safe divide amount
    function safeDivide(uint amount)
        public
        pure
        returns(uint amount1, uint amount2)
    {
        require(amount > 0);

        // calculate
        amount1 = amount / 2;
        amount2 = amount - amount1;
    }
}