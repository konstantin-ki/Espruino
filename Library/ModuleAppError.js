/**
 * Класс ErrorAppUser наследует и расширяет возможности базового класса ошибок.
 * Класс предназначен для поддержки ошибок в прикладных программах Espruino
 */
class ErrorAppUser extends Error {
    constructor(_message, _code) {
        this.message = _message;
        this.name = "ErrorAppUser"; //переопределяем имя типа
        this.Code = _code || 0; //поле с кодом ошибки
    }
}
exports = ErrorAppUser; //экспортируем класс (ВНИМАНИЕ - именно класс а не объект!)
