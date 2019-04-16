pragma solidity >=0.4.21 <0.6.0;

contract Splitter{
    // addresses
    address _owner; // alice is owner
    address _bob;
    uint _bobBalance;
    uint _carolBalance;
    address _carol;
    
    // constructor
    constructor(address bob, address carol)public {
        _owner=msg.sender;
        _bob=bob;
        _carol=carol;
    }
    
    function contractBlance() public view returns(uint){
        return address(this).balance;
    }
    
    function bobBalance() public view returns(uint){
        return _bobBalance;
    }
    function carolBalance() public view returns(uint){
        return _carolBalance;
    }
    
    // Split
    function Split()payable public{
        // check alice
        require(_owner==msg.sender);
        
        // calculate
        uint bobAmount=msg.value/2;
        uint carolAmount=msg.value-bobAmount;
        _bobBalance+=bobAmount;
        _carolBalance=carolAmount;
        
        // send
        _bob.transfer(bobAmount);
        _carol.transfer(carolAmount);
    }
}