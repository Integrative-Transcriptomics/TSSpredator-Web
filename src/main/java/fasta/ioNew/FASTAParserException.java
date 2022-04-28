
package fasta.ioNew;

/**
 * master-thesis-sfillinger
 * Description:
 *
 * @author fillinger
 * @version ${VERSION}
 *          Date: 1/18/16
 *          EMail: sven.fillinger@student.uni-tuebingen.de
 */
public class FASTAParserException extends RuntimeException {
    public FASTAParserException(){
        super();
    }

    public FASTAParserException(Throwable t){
        super(t);
    }

    public FASTAParserException(String s){
        super(s);
    }

    public FASTAParserException(String s, Throwable t){
        super(s, t);
    }
}
