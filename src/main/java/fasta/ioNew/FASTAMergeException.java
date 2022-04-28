
package fasta.ioNew;

/**
 * master-thesis-sfillinger
 * Description:
 *
 * @author fillinger
 * @version ${VERSION}
 *          Date: 1/21/16
 *          EMail: sven.fillinger@student.uni-tuebingen.de
 */
public class FASTAMergeException  extends RuntimeException{
    public FASTAMergeException(){
        super();
    }

    public FASTAMergeException(Throwable t){
        super(t);
    }

    public FASTAMergeException(String s){
        super(s);
    }

    public FASTAMergeException(String s, Throwable t){
        super(s, t);
    }
}
